-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('MENSUAL', 'UNICO');

-- CreateTable
CREATE TABLE "GananciaDiaria" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GananciaDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoGasto" NOT NULL,
    "fecha" DATE NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "plantillaKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GananciaDiaria_fecha_key" ON "GananciaDiaria"("fecha");

-- CreateIndex
CREATE INDEX "Gasto_tipo_fecha_idx" ON "Gasto"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_plantillaKey_fecha_idx" ON "Gasto"("plantillaKey", "fecha");
