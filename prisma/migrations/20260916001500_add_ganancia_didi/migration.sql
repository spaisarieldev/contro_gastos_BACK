-- CreateTable
CREATE TABLE "GananciaDidiDiaria" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "viajes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GananciaDidiDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GananciaDidiDiaria_fecha_key" ON "GananciaDidiDiaria"("fecha");
