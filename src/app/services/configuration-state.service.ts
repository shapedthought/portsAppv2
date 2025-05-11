import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Server } from '../models/server';
import {
  ProductsResponse,
  SourceServicesResponse,
  TargetServicesResponse,
} from '../models/responses';

// Interface for port mapping
export interface PortMapping {
  id: string;
  sourceServer: string;
  sourceServerId: string;
  targetServer: string;
  product: string;
  protocol: string;
  port: string;
  section: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationStateService {
  // Server state
  private sourceServerSubject = new BehaviorSubject<Server | null>(null);
  private targetServerSubject = new BehaviorSubject<Server | null>(null);
  private lastModifiedServerSubject = new BehaviorSubject<Server | null>(null);
  private serversSubject = new BehaviorSubject<Server[]>([]);

  // Selection state
  private selectedProductSubject = new BehaviorSubject<ProductsResponse | null>(
    null
  );
  private selectedSourceSubject =
    new BehaviorSubject<SourceServicesResponse | null>(null);
  private selectedTargetsSubject = new BehaviorSubject<
    TargetServicesResponse[]
  >([]);

  // Mappings state
  private mappingsSubject = new BehaviorSubject<PortMapping[]>([]);

  // Expose as Observables
  sourceServer$: Observable<Server | null> =
    this.sourceServerSubject.asObservable();
  targetServer$: Observable<Server | null> =
    this.targetServerSubject.asObservable();
  lastModifiedServer$: Observable<Server | null> =
    this.lastModifiedServerSubject.asObservable();
  servers$: Observable<Server[]> = this.serversSubject.asObservable();

  selectedProduct$: Observable<ProductsResponse | null> =
    this.selectedProductSubject.asObservable();
  selectedSource$: Observable<SourceServicesResponse | null> =
    this.selectedSourceSubject.asObservable();
  selectedTargets$: Observable<TargetServicesResponse[]> =
    this.selectedTargetsSubject.asObservable();

  mappings$: Observable<PortMapping[]> = this.mappingsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Try to restore state from SessionStorage only in browser environment
    this.restoreState();
  }

  // Server methods
  setSourceServer(server: Server | null): void {
    this.sourceServerSubject.next(server);
    if (server) {
      this.setLastModifiedServer(server);
    }
    this.saveState();
  }

  setTargetServer(server: Server | null): void {
    this.targetServerSubject.next(server);
    this.saveState();
  }

  setLastModifiedServer(server: Server | null): void {
    this.lastModifiedServerSubject.next(server);
    this.saveState();
  }

  setServers(servers: Server[]): void {
    this.serversSubject.next(servers);
    this.saveState();
  }

  // Maintain server list consistency
  addServer(server: Server): void {
    const currentServers = this.serversSubject.getValue();
    this.serversSubject.next([...currentServers, server]);
    this.saveState();
  }

  updateServer(server: Server): void {
    const currentServers = this.serversSubject.getValue();
    const updatedServers = currentServers.map((s) =>
      s.id === server.id ? server : s
    );
    this.serversSubject.next(updatedServers);
    this.saveState();
  }

  removeServer(serverId: number): void {
    // Update servers list
    const currentServers = this.serversSubject.getValue();
    this.serversSubject.next(currentServers.filter((s) => s.id !== serverId));

    // Update mappings to remove any that use this server
    const currentMappings = this.mappingsSubject.getValue();
    const serverToRemove = currentServers.find((s) => s.id === serverId);

    if (serverToRemove) {
      const updatedMappings = currentMappings.filter(
        (m) =>
          m.sourceServer !== serverToRemove.name &&
          m.targetServer !== serverToRemove.name
      );
      this.mappingsSubject.next(updatedMappings);
    }

    // Reset current server if it's the one being removed
    const currentSource = this.sourceServerSubject.getValue();
    if (currentSource?.id === serverId) {
      this.sourceServerSubject.next(null);
    }

    const currentTarget = this.targetServerSubject.getValue();
    if (currentTarget?.id === serverId) {
      this.targetServerSubject.next(null);
    }

    this.saveState();
  }

  // Selection methods
  setSelectedProduct(product: ProductsResponse | null): void {
    this.selectedProductSubject.next(product);
    // Reset dependent selections
    if (product !== this.selectedProductSubject.getValue()) {
      this.selectedSourceSubject.next(null);
      this.selectedTargetsSubject.next([]);
    }
    this.saveState();
  }

  setSelectedSource(source: SourceServicesResponse | null): void {
    this.selectedSourceSubject.next(source);
    // Reset target selection
    this.selectedTargetsSubject.next([]);
    this.saveState();
  }

  setSelectedTargets(targets: TargetServicesResponse[]): void {
    this.selectedTargetsSubject.next(targets);
    this.saveState();
  }

  // Mapping methods
  addMapping(mapping: PortMapping): void {
    const currentMappings = this.mappingsSubject.getValue();

    // Check if this mapping already exists based on all uniqueness factors
    const isDuplicate = currentMappings.some(
      (m) =>
        m.sourceServer === mapping.sourceServer &&
        m.targetServer === mapping.targetServer &&
        m.product === mapping.product &&
        m.section === mapping.section &&
        m.port === mapping.port
    );

    if (!isDuplicate) {
      this.mappingsSubject.next([...currentMappings, mapping]);
      this.saveState();
    }
  }

  addMappings(mappings: PortMapping[]): void {
    const currentMappings = this.mappingsSubject.getValue();
    const newMappings = [...currentMappings];
    let addedCount = 0;

    // Add only non-duplicate mappings
    mappings.forEach((mapping) => {
      const isDuplicate = currentMappings.some(
        (m) =>
          m.sourceServer === mapping.sourceServer &&
          m.targetServer === mapping.targetServer &&
          m.product === mapping.product &&
          m.section === mapping.section &&
          m.port === mapping.port
      );

      if (!isDuplicate) {
        newMappings.push(mapping);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.mappingsSubject.next(newMappings);
      this.saveState();
    }
  }

  removeMapping(mappingId: string): void {
    const currentMappings = this.mappingsSubject.getValue();
    this.mappingsSubject.next(
      currentMappings.filter((m) => m.id !== mappingId)
    );
    this.saveState();
  }

  updateMappingTargetServer(mappingId: string, newTargetServer: string): void {
    const currentMappings = this.mappingsSubject.getValue();
    const updatedMappings = currentMappings.map((m) => {
      if (m.id === mappingId) {
        return { ...m, targetServer: newTargetServer };
      }
      return m;
    });
    this.mappingsSubject.next(updatedMappings);
    this.saveState();
  }

  // Get current state values
  getCurrentState() {
    return {
      sourceServer: this.sourceServerSubject.getValue(),
      targetServer: this.targetServerSubject.getValue(),
      lastModifiedServer: this.lastModifiedServerSubject.getValue(),
      servers: this.serversSubject.getValue(),
      selectedProduct: this.selectedProductSubject.getValue(),
      selectedSource: this.selectedSourceSubject.getValue(),
      selectedTargets: this.selectedTargetsSubject.getValue(),
      mappings: this.mappingsSubject.getValue(),
    };
  }
  // State persistence methods
  private saveState(): void {
    // Only save to sessionStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      try {
        const state = this.getCurrentState();
        sessionStorage.setItem(
          'port-configuration-state',
          JSON.stringify(state)
        );
      } catch (e) {
        console.error('Failed to save configuration state:', e);
      }
    }
  }
  private restoreState(): void {
    // Only attempt to restore from sessionStorage in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip restoration in server-side rendering
    }

    try {
      const stateJson = sessionStorage.getItem('port-configuration-state');
      if (stateJson) {
        const state = JSON.parse(stateJson);

        // Restore all state values
        if (state.sourceServer)
          this.sourceServerSubject.next(state.sourceServer);
        if (state.targetServer)
          this.targetServerSubject.next(state.targetServer);
        if (state.lastModifiedServer)
          this.lastModifiedServerSubject.next(state.lastModifiedServer);
        if (state.servers) this.serversSubject.next(state.servers);
        if (state.selectedProduct)
          this.selectedProductSubject.next(state.selectedProduct);
        if (state.selectedSource)
          this.selectedSourceSubject.next(state.selectedSource);
        if (state.selectedTargets)
          this.selectedTargetsSubject.next(state.selectedTargets);
        if (state.mappings) this.mappingsSubject.next(state.mappings);
      }
    } catch (e) {
      console.error('Failed to restore configuration state:', e);
    }
  }

  // For future implementation
  exportMappings(): string {
    return JSON.stringify(this.mappingsSubject.getValue());
  }

  importMappings(mappingsJson: string): boolean {
    try {
      const mappings = JSON.parse(mappingsJson) as PortMapping[];
      this.mappingsSubject.next(mappings);
      this.saveState();
      return true;
    } catch (e) {
      console.error('Failed to import mappings', e);
      return false;
    }
  }
  clearState(): void {
    // Only clear sessionStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('port-configuration-state');
    }

    // Reset all state subjects regardless of platform
    this.sourceServerSubject.next(null);
    this.targetServerSubject.next(null);
    this.lastModifiedServerSubject.next(null);
    this.serversSubject.next([]);
    this.selectedProductSubject.next(null);
    this.selectedSourceSubject.next(null);
    this.selectedTargetsSubject.next([]);
    this.mappingsSubject.next([]);
  }
}
