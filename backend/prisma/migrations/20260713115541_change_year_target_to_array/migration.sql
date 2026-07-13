-- AlterTable
ALTER TABLE "calendar_events" ALTER COLUMN "yearTarget" DROP DEFAULT,
ALTER COLUMN "yearTarget" SET DATA TYPE "YearTarget"[] USING ARRAY["yearTarget"]::"YearTarget"[],
ALTER COLUMN "yearTarget" SET DEFAULT ARRAY['ALL']::"YearTarget"[];

-- AlterTable
ALTER TABLE "camps" ALTER COLUMN "yearTarget" DROP DEFAULT,
ALTER COLUMN "yearTarget" SET DATA TYPE "YearTarget"[] USING ARRAY["yearTarget"]::"YearTarget"[],
ALTER COLUMN "yearTarget" SET DEFAULT ARRAY['ALL']::"YearTarget"[];

-- AlterTable
ALTER TABLE "contests" ALTER COLUMN "yearTarget" DROP DEFAULT,
ALTER COLUMN "yearTarget" SET DATA TYPE "YearTarget"[] USING ARRAY["yearTarget"]::"YearTarget"[],
ALTER COLUMN "yearTarget" SET DEFAULT ARRAY['ALL']::"YearTarget"[];

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "yearTarget" DROP DEFAULT,
ALTER COLUMN "yearTarget" SET DATA TYPE "YearTarget"[] USING ARRAY["yearTarget"]::"YearTarget"[],
ALTER COLUMN "yearTarget" SET DEFAULT ARRAY['ALL']::"YearTarget"[];
