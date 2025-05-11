import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ServerComponent } from './server/server.component';
import { CardModule } from 'primeng/card';
import { Server } from '../models/server';
import { ButtonModule } from 'primeng/button';
import { AddServerDialogComponent } from './add-server-dialog/add-server-dialog.component';
import { ConfirmationService, ConfirmEventType } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfigurationStateService } from '../services/configuration-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-servers',
  imports: [
    ConfigurationComponent,
    CardModule,
    ServerComponent,
    ButtonModule,
    AddServerDialogComponent,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './servers.component.html',
  styleUrl: './servers.component.css',
})
export class ServersComponent implements OnInit, OnDestroy {
  servers: Server[] = [];
  selectedServer: Server | null = null;
  showServerDialog: boolean = false;

  // Subject to handle unsubscriptions
  private destroy$ = new Subject<void>();
  serverToEdit: Server | null = null;
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private stateService: ConfigurationStateService
  ) {}

  ngOnInit(): void {
    // Subscribe to servers from the state service
    this.stateService.servers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((servers) => {
        if (servers && servers.length > 0) {
          this.servers = servers;

          // If we have a selected server in state, use that
          this.stateService.lastModifiedServer$
            .pipe(takeUntil(this.destroy$))
            .subscribe((lastServer) => {
              if (lastServer) {
                const serverInList = this.servers.find(
                  (s) => s.id === lastServer.id
                );
                if (serverInList) {
                  this.selectedServer = serverInList;
                  return;
                }
              }

              // Default to first server if no last server or last server not found
              if (this.servers.length > 0 && !this.selectedServer) {
                this.selectedServer = this.servers[0];
              }
            });
        } else {
          // Initialize with default servers if none exist in state
          this.initializeDefaultServers();
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDefaultServers(): void {
    const defaultServers: Server[] = [
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

    this.servers = defaultServers;
    this.stateService.setServers(defaultServers);
    this.selectedServer = defaultServers[0];
  }
  saveServer(serverData: { id?: number; name: string; location: string }) {
    if (serverData.id) {
      // Edit existing server
      const existingServer = this.servers.find((s) => s.id === serverData.id);
      if (!existingServer) return;

      const updatedServer: Server = {
        ...existingServer,
        name: serverData.name,
        location: serverData.location,
      };

      // Update servers in state service
      this.stateService.updateServer(updatedServer);

      // Update local list
      this.servers = this.servers.map((server) =>
        server.id === serverData.id ? updatedServer : server
      );

      // If the edited server is currently selected, update selectedServer
      if (this.selectedServer && this.selectedServer.id === serverData.id) {
        this.selectedServer = updatedServer;
      }

      console.log('Server updated:', updatedServer);
    } else {
      // Add new server
      const newId = Math.max(...this.servers.map((s) => s.id), 0) + 1;

      const newServer: Server = {
        id: newId,
        name: serverData.name,
        location: serverData.location,
        totalMappedPorts: 0,
      };

      // Add to state service
      this.stateService.addServer(newServer);

      // Update local list
      this.servers = [...this.servers, newServer];
      console.log('Server added:', newServer);

      // Select the new server
      this.selectServer(newServer);
    }
  }
  selectServer(server: Server) {
    this.selectedServer = server;
    console.log('Selected server:', server);

    // Always update the source server when a new server is selected
    this.stateService.setSourceServer(server);

    // Also update last modified server for state persistence
    this.stateService.setLastModifiedServer(server);
  }

  editServer(server: Server) {
    this.serverToEdit = server;
    this.showServerDialog = true;
    console.log('Editing server:', server);
  }
  deleteServer(server: Server) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${server.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Remove from state service first (will also remove related mappings)
        this.stateService.removeServer(server.id);

        // Filter out the server to be deleted from local list
        this.servers = this.servers.filter((s) => s.id !== server.id);

        // If the deleted server was selected, select the first available server or null
        if (this.selectedServer && this.selectedServer.id === server.id) {
          this.selectedServer =
            this.servers.length > 0 ? this.servers[0] : null;

          // Update last modified server in state service
          if (this.selectedServer) {
            this.stateService.setLastModifiedServer(this.selectedServer);
          }
        }

        const serverName = server.name || 'Server';
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${serverName} has been deleted`,
        });

        console.log('Server deleted:', server);
      },
      reject: (type: ConfirmEventType) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({
              severity: 'info',
              summary: 'Cancelled',
              detail: 'You have cancelled the deletion',
            });
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({
              severity: 'info',
              summary: 'Cancelled',
              detail: 'You have cancelled the deletion',
            });
            break;
        }
      },
    });
  }

  addNewServer() {
    this.serverToEdit = null;
    this.showServerDialog = true;
  }

  toggleDialog() {
    this.showServerDialog = !this.showServerDialog;
    if (!this.showServerDialog) {
      this.serverToEdit = null;
    }
  }
}
