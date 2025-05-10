import { Component } from '@angular/core';
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
export class ServersComponent {
  servers: Server[] = [
    {
      id: 1,
      name: 'Server 1',
      location: 'Location 1',
      totalMappedPorts: 10,
    },
    {
      id: 2,
      name: 'Server 2',
      location: 'Location 2',
      totalMappedPorts: 20,
    },
    {
      id: 3,
      name: 'Server 3',
      location: 'Location 3',
      totalMappedPorts: 30,
    },
  ];

  selectedServer: Server = this.servers[0]; // Default to first server
  showServerDialog: boolean = false;
  serverToEdit: Server | null = null;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  saveServer(serverData: { id?: number; name: string; location: string }) {
    if (serverData.id) {
      // Edit existing server
      this.servers = this.servers.map((server) =>
        server.id === serverData.id
          ? { ...server, name: serverData.name, location: serverData.location }
          : server
      );

      // If the edited server is currently selected, update selectedServer
      if (this.selectedServer.id === serverData.id) {
        this.selectedServer = {
          ...this.selectedServer,
          name: serverData.name,
          location: serverData.location,
        };
      }

      console.log('Server updated:', serverData);
    } else {
      // Add new server
      const newId = Math.max(...this.servers.map((s) => s.id), 0) + 1;

      const newServer: Server = {
        id: newId,
        name: serverData.name,
        location: serverData.location,
        totalMappedPorts: 0,
      };

      this.servers = [...this.servers, newServer];
      console.log('Server added:', newServer);

      // Select the new server
      this.selectServer(newServer);
    }
  }

  selectServer(server: Server) {
    this.selectedServer = server;
    console.log('Selected server:', server);
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
        // Filter out the server to be deleted
        this.servers = this.servers.filter((s) => s.id !== server.id);

        // If the deleted server was selected, select the first available server or null
        if (this.selectedServer.id === server.id) {
          this.selectedServer =
            this.servers.length > 0 ? this.servers[0] : (null as any);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${server.name} has been deleted`,
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
