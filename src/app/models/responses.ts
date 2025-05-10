export interface ProductsResponse {
  id: string;
  name: string;
}

export interface SourceServicesResponse {
  id: string;
  fromPort: string;
  product: string;
  section: string;
}

export interface TargetServicesResponse {
  id: string;
  toPort: string;
  product: string;
}

export interface PortDataResponse {
  id: string;
  product: string;
  fromPort: string;
  toPort: string;
  protocol: string;
  section: string;
  description: string;
}
