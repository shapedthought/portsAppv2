import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CardModule } from 'primeng/card';
import { Server } from '../../models/server';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PortDataService } from '../../services/port-data.service';
import {
  PortRequest,
  SourceRequest,
  TargetRequest,
} from '../../models/requests';
import {
  PortDataResponse,
  SourceServicesResponse,
  TargetServicesResponse,
} from '../../models/responses';
import { ProductsResponse } from '../../models/responses';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-configuration',
  imports: [
    CardModule,
    ReactiveFormsModule,
    InputTextModule,
    CommonModule,
    ButtonModule,
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  @Input() server!: Server;

  products: ProductsResponse[] = [];
  sources: SourceServicesResponse[] = [];
  targets: TargetServicesResponse[] = [];
  ports: PortDataResponse[] = [];

  // Subject to handle unsubscriptions
  private destroy$ = new Subject<void>();

  constructor(private portDataService: PortDataService) {}

  ngOnInit() {
    this.portDataService
      .getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ProductsResponse[]) => {
          this.products = data;
          console.log(this.products);
        },
        error: (error) => {
          console.error('Error fetching products:', error);
        },
      });
  }

  getSourceData() {
    const sourceRequest: SourceRequest = {
      productName: this.products[0].name,
    };

    this.portDataService
      .getSources(sourceRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: SourceServicesResponse[]) => {
          this.sources = data;
          console.log(this.sources);
        },
        error: (error) => {
          console.error('Error fetching ports:', error);
        },
      });
  }

  getTargetData() {
    const targetRequest: TargetRequest = {
      fromPort: this.products[0].id,
      productName: this.products[0].name,
    };

    console.log(targetRequest);

    this.portDataService
      .getTargets(targetRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: TargetServicesResponse[]) => {
          this.targets = data;
          console.log(this.targets);
        },
        error: (error) => {
          console.error('Error fetching ports:', error);
        },
      });
  }

  getPortData() {
    const portRequest: PortRequest = {
      fromPort: this.sources[0].fromPort,
      productName: this.sources[0].product,
    };

    console.log(portRequest);

    this.portDataService
      .getPorts(portRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PortDataResponse[]) => {
          this.ports = data;
          console.log(this.ports);
        },
        error: (error) => {
          console.error('Error fetching ports:', error);
        },
      });
  }

  ngOnDestroy() {
    // Emit a value to trigger all takeUntil operators
    this.destroy$.next();
    // Complete the subject
    this.destroy$.complete();
  }
}
