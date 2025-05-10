import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServersComponent } from './servers/servers.component';
import { PortsComponent } from './ports/ports.component';
import { DiagramComponent } from './diagram/diagram.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', title: 'Dashboard', component: DashboardComponent },
  {
    path: 'servers',
    title: 'Server Configuration',
    component: ServersComponent,
  },
  { path: 'ports', title: 'Ports Overview', component: PortsComponent },
  { path: 'diagram', title: 'Network Diagram', component: DiagramComponent },
];
