-- CreateTable
CREATE TABLE "ReportBrief" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "kbVersion" TEXT NOT NULL,
    "briefVersion" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeReport" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "reportBriefId" TEXT NOT NULL,
    "llmProvider" TEXT NOT NULL,
    "llmModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativeReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportBrief_chartId_idx" ON "ReportBrief"("chartId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportBrief_chartId_kbVersion_briefVersion_key" ON "ReportBrief"("chartId", "kbVersion", "briefVersion");

-- CreateIndex
CREATE INDEX "NarrativeReport_chartId_idx" ON "NarrativeReport"("chartId");

-- CreateIndex
CREATE INDEX "NarrativeReport_reportBriefId_idx" ON "NarrativeReport"("reportBriefId");

-- CreateIndex
CREATE UNIQUE INDEX "NarrativeReport_cache_key" ON "NarrativeReport"("chartId", "reportBriefId", "llmProvider", "llmModel", "promptVersion");

-- AddForeignKey
ALTER TABLE "ReportBrief" ADD CONSTRAINT "ReportBrief_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeReport" ADD CONSTRAINT "NarrativeReport_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeReport" ADD CONSTRAINT "NarrativeReport_reportBriefId_fkey" FOREIGN KEY ("reportBriefId") REFERENCES "ReportBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
