export interface Car {
  id: number;
  driverId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  seatCapacity: number;
  isDefault: boolean;
}

export interface CreateCarDTO {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  seatCapacity: number;
}

export interface UpdateCarDTO extends Partial<CreateCarDTO> {}
