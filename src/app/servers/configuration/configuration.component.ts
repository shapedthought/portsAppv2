import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

// Application imports
import { Server } from '../../models/server';
import { PortDataService } from '../../services/port-data.service';
import {
  ConfigurationStateService,
  PortMapping,
} from '../../services/configuration-state.service';
import {
  PortRequest,
  SourceRequest,
  TargetRequest,
} from '../../models/requests';
import {
  PortDataResponse,
  SourceServicesResponse,
  TargetServicesResponse,
  ProductsResponse,
} from '../../models/responses';

// RxJS imports
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    TableModule,
    PanelModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  @Input() set server(value: Server) {
    if (value) {
      this.sourceServer = value;
      this.stateService.setSourceServer(value);
      this.loadInitialData();
    }
  }

  get server(): Server {
    return this.sourceServer as Server;
  }

  // Server state
  sourceServer: Server | null = null;
  selectedTargetServer: Server | null = null;
  servers: Server[] = [];

  // Data state
  products: ProductsResponse[] = [];
  sources: SourceServicesResponse[] = [];
  targets: TargetServicesResponse[] = [];
  ports: PortDataResponse[] = [];
  mappings: PortMapping[] = [];

  // Selection state
  selectedProduct: ProductsResponse | null = null;
  selectedSource: SourceServicesResponse | null = null;
  selectedTargets: TargetServicesResponse[] = [];
  selectedPort: PortDataResponse | null = null;

  // Loading state
  loading = {
    servers: false,
    products: false,
    sources: false,
    targets: false,
    ports: false,
    mappings: false,
  };
  // Computed property to filter mappings for the current server
  get serverMappings(): PortMapping[] {
    if (!this.sourceServer || !this.mappings) return [];
    const serverName = this.sourceServer.name;
    return this.mappings.filter(
      (m) => m.sourceServer === serverName || m.targetServer === serverName
    );
  }

  // Subject to handle unsubscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private portDataService: PortDataService,
    private stateService: ConfigurationStateService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}
  ngOnInit() {
    // Track previous server ID to detect changes
    let previousServerId: number | null = null;

    // Subscribe to state changes
    this.stateService.sourceServer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((server) => {
        if (server) {
          this.sourceServer = server;

          // Only reload data if the server has changed
          if (server.id !== previousServerId) {
            previousServerId = server.id;
            this.loadInitialData();
            this.updatePortCountForServer();
          }
        }
      });

    this.stateService.targetServer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((server) => {
        this.selectedTargetServer = server;
      });

    this.stateService.servers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((servers) => {
        this.servers = servers;
      });

    this.stateService.selectedProduct$
      .pipe(takeUntil(this.destroy$))
      .subscribe((product) => {
        this.selectedProduct = product;
      });

    this.stateService.selectedSource$
      .pipe(takeUntil(this.destroy$))
      .subscribe((source) => {
        this.selectedSource = source;
      });

    this.stateService.selectedTargets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((targets) => {
        this.selectedTargets = targets;
      });

    this.stateService.mappings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mappings) => {
        this.mappings = mappings;
      });

    // Load initial data
    this.loadProducts();

    // Mock servers for development
    // In a real implementation, this would come from a service
    if (this.servers.length === 0) {
      this.servers = [
        {
          id: 1,
          name: 'Server 1',
          location: 'Location 1',
          totalMappedPorts: 0,
        },
        {
          id: 2,
          name: 'Server 2',
          location: 'Location 2',
          totalMappedPorts: 0,
        },
        {
          id: 3,
          name: 'Server 3',
          location: 'Location 3',
          totalMappedPorts: 0,
        },
      ];
      this.stateService.setServers(this.servers);
    }

    // If we don't have a target server selected yet, select the first one
    if (!this.selectedTargetServer && this.servers.length > 0) {
      this.selectedTargetServer = this.servers[0];
      this.stateService.setTargetServer(this.selectedTargetServer);
    }
  }
  loadInitialData() {
    // Load port mappings for the current server
    if (this.sourceServer) {
      this.loading.mappings = true;
      this.stateService.mappings$
        .pipe(takeUntil(this.destroy$))
        .subscribe((mappings) => {
          this.mappings = mappings;
          this.loading.mappings = false;
          console.log('Mappings loaded:', this.mappings);
        });
    }

    // If we have stored selections, load their data
    if (this.selectedProduct) {
      this.loadSourceData();

      if (this.selectedSource) {
        this.loadTargetData();
      }
    } else {
      // Otherwise just load products
      this.loadProducts();
    }
  }

  loadProducts() {
    this.loading.products = true;

    this.portDataService
      .getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ProductsResponse[]) => {
          this.products = data;
          this.loading.products = false;
          console.log('Products loaded:', this.products);
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.loading.products = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load products. Please try again.',
          });
        },
      });
  }

  onProductChange() {
    if (!this.selectedProduct) return;

    this.stateService.setSelectedProduct(this.selectedProduct);
    this.loadSourceData();
  }

  loadSourceData() {
    if (!this.selectedProduct) return;

    this.loading.sources = true;

    const sourceRequest: SourceRequest = {
      productName: this.selectedProduct.name,
    };

    this.portDataService
      .getSources(sourceRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: SourceServicesResponse[]) => {
          this.sources = data;
          this.loading.sources = false;
          console.log('Sources loaded:', this.sources);
        },
        error: (error) => {
          console.error('Error fetching sources:', error);
          this.loading.sources = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load source data. Please try again.',
          });
        },
      });
  }
  onSourceSelect(
    source: SourceServicesResponse | SourceServicesResponse[] | undefined
  ) {
    // Handle the case where source might be undefined or an array
    if (!source) {
      console.warn('Source select event received with no data');
      return;
    }

    // If it's an array, use the first item (shouldn't happen with single selection mode)
    const sourceData = Array.isArray(source) ? source[0] : source;

    this.selectedSource = sourceData;
    this.stateService.setSelectedSource(sourceData);
    this.loadTargetData();
  }
  loadTargetData() {
    if (!this.selectedSource || !this.selectedProduct) return;

    this.loading.targets = true;

    const portRequest: PortRequest = {
      fromPort: this.selectedSource.fromPort,
      productName: this.selectedProduct.name,
      section: this.selectedSource.section,
    };

    this.portDataService
      .getPorts(portRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PortDataResponse[]) => {
          // Store the full port data for later use
          this.ports = data; // Map the port data to the targets format for the table
          this.targets = data.map((port) => ({
            id: port.id,
            toPort: port.toPort,
            product: port.product,
            // Add additional fields that might be needed
            fromPort: port.fromPort,
            protocol: port.protocol,
            section: port.section,
            description: port.description,
            // Use the actual port field from the API response
            port: port.port,
          }));

          this.loading.targets = false;
          console.log('Targets loaded from ports data:', this.targets);
        },
        error: (error) => {
          console.error('Error fetching ports data:', error);
          this.loading.targets = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load target data. Please try again.',
          });
        },
      });
  }
  onTargetSelect(target: any) {
    // Save the current selection state
    this.stateService.setSelectedTargets(this.selectedTargets);

    // Handle the case where target might be undefined or an array
    if (!target) {
      console.warn('Target select event received with no data');
      return;
    }

    // If it's an array, use the first item
    const targetData = Array.isArray(target) ? target[0] : target;

    // We already have the port data, so just find the matching port
    this.updateSelectedPort(targetData);
  }

  /**
   * Updates the selected port based on the target selection
   * @param target The target port that was selected
   */
  updateSelectedPort(target: any) {
    if (!this.ports || !target) return;

    // Find the matching port in our already loaded ports data
    const matchingPort = this.ports.find((port) => port.id === target.id);

    if (matchingPort) {
      this.selectedPort = matchingPort;
      console.log('Selected port:', this.selectedPort);
    } else {
      console.warn('No matching port found for target:', target);
      this.selectedPort = null;
    }
  }

  onTargetServerChange() {
    if (this.selectedTargetServer) {
      this.stateService.setTargetServer(this.selectedTargetServer);
    }
  }
  assignSelectedPorts() {
    if (
      !this.selectedTargets.length ||
      !this.selectedTargetServer ||
      !this.selectedSource
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select target ports and a target server to assign.',
      });
      return;
    }

    // Process each selected target
    this.selectedTargets.forEach((target) => {
      // Find port data for this target
      const portData = this.ports.find((p) => p.id === target.id);

      if (portData) {
        // Create a new mapping
        const newMapping: PortMapping = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceServer: this.sourceServer?.name || 'Unknown',
          sourceServerId: this.selectedSource?.id || '',
          targetServer: this.selectedTargetServer?.name || 'Unknown',
          product: this.selectedProduct?.name || portData.product,
          protocol: portData.protocol || 'TCP',
          port: portData.port,
          section: this.selectedSource?.section || portData.section || '',
          description: portData.description || '',
        };

        // Add to state service which will handle duplicate checking
        this.stateService.addMapping(newMapping);
      }
    });

    // Clear selections after assignment
    this.selectedTargets = [];
    this.stateService.setSelectedTargets([]);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Ports have been assigned successfully.',
    });

    // Update the server's mapped ports count
    this.updatePortCountForServer();
  }

  getMappingsForServer(serverName: string): PortMapping[] {
    return this.mappings.filter(
      (m) => m.sourceServer === serverName || m.targetServer === serverName
    );
  }

  confirmDeleteMapping(mapping: PortMapping) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the mapping for port ${mapping.port}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteMapping(mapping);
      },
    });
  }
  deleteMapping(mapping: PortMapping) {
    this.stateService.removeMapping(mapping.id);

    this.messageService.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Port mapping has been removed.`,
    });

    // Update the server's mapped ports count
    this.updatePortCountForServer();
  }
  updateMappingTargetServer(
    mappingId: string,
    newTargetServer: Server | string
  ) {
    // Extract the server name if we received a Server object
    const serverName =
      typeof newTargetServer === 'object'
        ? newTargetServer.name
        : newTargetServer;

    this.stateService.updateMappingTargetServer(mappingId, serverName);

    this.messageService.add({
      severity: 'success',
      summary: 'Updated',
      detail: `Target server has been changed to ${serverName}.`,
    });
  }

  /**
   * Helper method to safely handle filter events from inputs
   * @param table The PrimeNG table reference
   * @param event The input event
   */
  onFilterTable(table: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value || '';
    table.filterGlobal(value, 'contains');
  }

  /**
   * Helper method to find a server object by its name
   * @param serverName The name of the server to find
   * @returns The server object matching the name, or undefined if not found
   */
  getServerByName(serverName: string): Server | undefined {
    if (!serverName || !this.servers || this.servers.length === 0)
      return undefined;
    return this.servers.find((s) => s.name === serverName);
  }

  /**
   * Updates the server's total mapped ports count
   */
  updatePortCountForServer() {
    if (this.sourceServer) {
      const count = this.getMappingsForServer(this.sourceServer.name).length;
      if (this.sourceServer.totalMappedPorts !== count) {
        const updatedServer = {
          ...this.sourceServer,
          totalMappedPorts: count,
        };
        this.stateService.updateServer(updatedServer);
      }
    }
  }

  ngOnDestroy() {
    // Save state before destroying component
    if (this.sourceServer) {
      this.stateService.setLastModifiedServer(this.sourceServer);
    }

    // Emit a value to trigger all takeUntil operators
    this.destroy$.next();
    // Complete the subject
    this.destroy$.complete();
  }
}
