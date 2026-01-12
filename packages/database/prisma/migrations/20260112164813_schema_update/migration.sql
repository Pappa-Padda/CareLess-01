/*
  Warnings:

  - The primary key for the `Passenger_Allocation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Driver_Booking_ID` on the `Passenger_Allocation` table. All the data in the column will be lost.
  - You are about to drop the `Driver_Booking` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `Lift_Offer_ID` to the `Passenger_Allocation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Driver_Booking` DROP FOREIGN KEY `Driver_Booking_Car_ID_fkey`;

-- DropForeignKey
ALTER TABLE `Driver_Booking` DROP FOREIGN KEY `Driver_Booking_Driver_ID_fkey`;

-- DropForeignKey
ALTER TABLE `Driver_Booking` DROP FOREIGN KEY `Driver_Booking_Event_ID_fkey`;

-- DropForeignKey
ALTER TABLE `Passenger_Allocation` DROP FOREIGN KEY `Passenger_Allocation_Driver_Booking_ID_fkey`;

-- AlterTable
ALTER TABLE `Address` ADD COLUMN `Link` TEXT NULL,
    ADD COLUMN `Nickname` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Address_List` ADD COLUMN `Is_Default` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Car` ADD COLUMN `Color` VARCHAR(191) NOT NULL DEFAULT 'White',
    ADD COLUMN `Is_Default` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `Is_Recurring` BOOLEAN NOT NULL DEFAULT false;

-- RecreateTable Passenger_Allocation to handle PK change on TiDB
DROP TABLE `Passenger_Allocation`;

CREATE TABLE `Passenger_Allocation` (
    `Lift_Offer_ID` INTEGER NOT NULL,
    `Passenger_ID` INTEGER NOT NULL,
    `Pickup_ID` INTEGER NOT NULL,
    `Is_Returning` BOOLEAN NOT NULL DEFAULT false,
    `Is_Confirmed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`Lift_Offer_ID`, `Passenger_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- DropTable
DROP TABLE `Driver_Booking`;

-- CreateTable
CREATE TABLE `Lift_Offer` (
    `Lift_Offer_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Driver_ID` INTEGER NOT NULL,
    `Event_ID` INTEGER NOT NULL,
    `Date` DATE NOT NULL,
    `Car_ID` INTEGER NOT NULL,
    `Available_Seats` INTEGER NOT NULL,
    `Is_Returning` BOOLEAN NOT NULL DEFAULT false,
    `Notes` TEXT NULL,

    PRIMARY KEY (`Lift_Offer_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lift_Request` (
    `Lift_Request_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Passenger_ID` INTEGER NOT NULL,
    `Event_ID` INTEGER NOT NULL,
    `Date` DATE NOT NULL,
    `Status` ENUM('PENDING', 'ASSIGNED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `Created_At` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Lift_Request_Passenger_ID_Event_ID_Date_key`(`Passenger_ID`, `Event_ID`, `Date`),
    PRIMARY KEY (`Lift_Request_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lift_Offer` ADD CONSTRAINT `Lift_Offer_Driver_ID_fkey` FOREIGN KEY (`Driver_ID`) REFERENCES `Driver`(`Driver_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lift_Offer` ADD CONSTRAINT `Lift_Offer_Event_ID_fkey` FOREIGN KEY (`Event_ID`) REFERENCES `Event`(`Event_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lift_Offer` ADD CONSTRAINT `Lift_Offer_Car_ID_fkey` FOREIGN KEY (`Car_ID`) REFERENCES `Car`(`Car_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Lift_Offer_ID_fkey` FOREIGN KEY (`Lift_Offer_ID`) REFERENCES `Lift_Offer`(`Lift_Offer_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Passenger_ID_fkey` FOREIGN KEY (`Passenger_ID`) REFERENCES `Passenger`(`Passenger_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Pickup_ID_fkey` FOREIGN KEY (`Pickup_ID`) REFERENCES `Pickup`(`Pickup_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lift_Request` ADD CONSTRAINT `Lift_Request_Passenger_ID_fkey` FOREIGN KEY (`Passenger_ID`) REFERENCES `Passenger`(`Passenger_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lift_Request` ADD CONSTRAINT `Lift_Request_Event_ID_fkey` FOREIGN KEY (`Event_ID`) REFERENCES `Event`(`Event_ID`) ON DELETE CASCADE ON UPDATE CASCADE;
