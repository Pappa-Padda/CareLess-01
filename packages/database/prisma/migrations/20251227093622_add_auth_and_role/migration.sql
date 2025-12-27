-- CreateTable
CREATE TABLE `Address` (
    `Address_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Street` VARCHAR(191) NOT NULL,
    `City` VARCHAR(191) NOT NULL,
    `Province` VARCHAR(191) NOT NULL,
    `Postal_Code` VARCHAR(191) NOT NULL,
    `Country` VARCHAR(191) NOT NULL,
    `Latitude` DECIMAL(10, 8) NULL,
    `Longitude` DECIMAL(11, 8) NULL,

    PRIMARY KEY (`Address_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `User_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Phone_Number` VARCHAR(191) NOT NULL,
    `Email` VARCHAR(191) NULL,
    `Password_Hash` VARCHAR(191) NULL,
    `Role` ENUM('USER', 'ADMIN', 'MODERATOR') NOT NULL DEFAULT 'USER',
    `Profile_Picture` VARCHAR(191) NULL,
    `Is_Driver` BOOLEAN NOT NULL DEFAULT false,
    `Is_Passenger` BOOLEAN NOT NULL DEFAULT false,
    `Created_At` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Last_Updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_Email_key`(`Email`),
    PRIMARY KEY (`User_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address_List` (
    `Address_ID` INTEGER NOT NULL,
    `User_ID` INTEGER NOT NULL,
    `Rank` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`Address_ID`, `User_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver` (
    `Driver_ID` INTEGER NOT NULL,

    PRIMARY KEY (`Driver_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Passenger` (
    `Passenger_ID` INTEGER NOT NULL,

    PRIMARY KEY (`Passenger_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `Group_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Description` TEXT NULL,
    `Profile_Picture` VARCHAR(191) NULL,
    `Created_At` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Last_Updated` DATETIME(3) NOT NULL,

    PRIMARY KEY (`Group_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_Group_Association` (
    `User_ID` INTEGER NOT NULL,
    `Group_ID` INTEGER NOT NULL,
    `Is_Admin` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`User_ID`, `Group_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Car` (
    `Car_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Driver_ID` INTEGER NOT NULL,
    `Make` VARCHAR(191) NOT NULL,
    `Model` VARCHAR(191) NOT NULL,
    `Year` INTEGER NOT NULL,
    `License_Plate` VARCHAR(191) NOT NULL,
    `Seat_Capacity` INTEGER NOT NULL,

    PRIMARY KEY (`Car_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `Event_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Address_ID` INTEGER NOT NULL,
    `Group_ID` INTEGER NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Description` TEXT NULL,
    `Date` DATE NOT NULL,
    `Start_Time` TIME NOT NULL,
    `End_Time` TIME NOT NULL,

    PRIMARY KEY (`Event_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver_Booking` (
    `Driver_Booking_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Driver_ID` INTEGER NOT NULL,
    `Event_ID` INTEGER NOT NULL,
    `Car_ID` INTEGER NOT NULL,
    `Available_Seats` INTEGER NOT NULL,
    `Is_Returning` BOOLEAN NOT NULL DEFAULT false,
    `Notes` TEXT NULL,

    PRIMARY KEY (`Driver_Booking_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pickup` (
    `Pickup_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Address_ID` INTEGER NOT NULL,
    `Time` TIME NOT NULL,
    `Passenger_Count` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`Pickup_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Passenger_Allocation` (
    `Driver_Booking_ID` INTEGER NOT NULL,
    `Passenger_ID` INTEGER NOT NULL,
    `Pickup_ID` INTEGER NOT NULL,
    `Is_Returning` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`Driver_Booking_ID`, `Passenger_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Address_List` ADD CONSTRAINT `Address_List_Address_ID_fkey` FOREIGN KEY (`Address_ID`) REFERENCES `Address`(`Address_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address_List` ADD CONSTRAINT `Address_List_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver` ADD CONSTRAINT `Driver_Driver_ID_fkey` FOREIGN KEY (`Driver_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger` ADD CONSTRAINT `Passenger_Passenger_ID_fkey` FOREIGN KEY (`Passenger_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Group_Association` ADD CONSTRAINT `User_Group_Association_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Group_Association` ADD CONSTRAINT `User_Group_Association_Group_ID_fkey` FOREIGN KEY (`Group_ID`) REFERENCES `Group`(`Group_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Car` ADD CONSTRAINT `Car_Driver_ID_fkey` FOREIGN KEY (`Driver_ID`) REFERENCES `Driver`(`Driver_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_Address_ID_fkey` FOREIGN KEY (`Address_ID`) REFERENCES `Address`(`Address_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_Group_ID_fkey` FOREIGN KEY (`Group_ID`) REFERENCES `Group`(`Group_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver_Booking` ADD CONSTRAINT `Driver_Booking_Driver_ID_fkey` FOREIGN KEY (`Driver_ID`) REFERENCES `Driver`(`Driver_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver_Booking` ADD CONSTRAINT `Driver_Booking_Event_ID_fkey` FOREIGN KEY (`Event_ID`) REFERENCES `Event`(`Event_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver_Booking` ADD CONSTRAINT `Driver_Booking_Car_ID_fkey` FOREIGN KEY (`Car_ID`) REFERENCES `Car`(`Car_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pickup` ADD CONSTRAINT `Pickup_Address_ID_fkey` FOREIGN KEY (`Address_ID`) REFERENCES `Address`(`Address_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Driver_Booking_ID_fkey` FOREIGN KEY (`Driver_Booking_ID`) REFERENCES `Driver_Booking`(`Driver_Booking_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Passenger_ID_fkey` FOREIGN KEY (`Passenger_ID`) REFERENCES `Passenger`(`Passenger_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Passenger_Allocation` ADD CONSTRAINT `Passenger_Allocation_Pickup_ID_fkey` FOREIGN KEY (`Pickup_ID`) REFERENCES `Pickup`(`Pickup_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;
