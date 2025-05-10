import { PortDataResponse } from './responses';

export interface MappedPorts {
  sourceServerId: number;
  sourceServerName: string;
  targetServerId: number;
  targetServerName: string;
  sourcePorts: PortDataResponse[];
  targetPorts: PortDataResponse[];
}
