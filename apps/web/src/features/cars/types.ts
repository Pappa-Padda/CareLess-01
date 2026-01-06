export interface Car {
  id: number;
  driverId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  seatCapacity: number;
}

export interface CreateCarDTO {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  seatCapacity: number;
}

export interface UpdateCarDTO extends Partial<CreateCarDTO> {}
