/*
  Warnings:

  - Added the required column `department` to the `ContactMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `ContactMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "subject" TEXT NOT NULL;
