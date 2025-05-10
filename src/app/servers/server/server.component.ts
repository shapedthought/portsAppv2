import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Server } from '../../models/server';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-server',
  imports: [CardModule, ButtonModule, NgClass],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
})
export class ServerComponent {
  @Input() server!: Server;
  @Input() isSelected: boolean = false;
  @Output() editServer = new EventEmitter<Server>();
  @Output() deleteServer = new EventEmitter<Server>();

  onEditItem() {
    this.editServer.emit(this.server);
  }

  onDeleteItem() {
    this.deleteServer.emit(this.server);
  }
}
