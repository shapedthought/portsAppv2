import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar-tabs',
  imports: [TabsModule, RouterModule],
  templateUrl: './navbar-tabs.component.html',
  styleUrl: './navbar-tabs.component.css',
})
export class NavbarTabsComponent {
  tabs = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      route: 'dashboard',
    },
    {
      label: 'Server Configuration',
      icon: 'pi pi-fw pi-server',
      route: 'servers',
    },
    {
      label: 'Ports Overview',
      icon: 'pi pi-fw pi-envelope',
      route: 'ports',
    },
    {
      label: 'Network Diagram',
      icon: 'pi pi-fw pi-cog',
      route: 'diagram',
    },
  ];
}
