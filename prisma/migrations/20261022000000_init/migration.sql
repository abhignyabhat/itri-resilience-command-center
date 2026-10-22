-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PROVISIONAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "InputSource" AS ENUM ('MANUAL');

-- CreateEnum
CREATE TYPE "RemediationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('RESILIENCE_REPORT', 'PARAMETER_SUMMARY', 'TREND_REPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ModelStatus" NOT NULL DEFAULT 'DRAFT',
    "goodThreshold" DECIMAL(5,2) NOT NULL DEFAULT 75,
    "okayThreshold" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parameter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chartLabel" JSONB NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subparameter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subparameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentInput" (
    "id" TEXT NOT NULL,
    "assessmentPeriodId" TEXT NOT NULL,
    "subparameterId" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "source" "InputSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentPeriodId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "score" DECIMAL(6,3),
    "provisionalEstimate" DECIMAL(6,3),
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "scoredCount" INTEGER NOT NULL DEFAULT 0,
    "requiredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParameterResult" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "score" DECIMAL(6,3),
    "change" DECIMAL(6,3),
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ParameterResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubparameterResult" (
    "id" TEXT NOT NULL,
    "parameterResultId" TEXT NOT NULL,
    "subparameterId" TEXT NOT NULL,
    "score" DECIMAL(6,3),

    CONSTRAINT "SubparameterResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remediation" (
    "id" TEXT NOT NULL,
    "subparameterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "RemediationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RemediationStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remediation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDownload" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "userId" TEXT,
    "periodId" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ModelVersion_version_key" ON "ModelVersion"("version");

-- CreateIndex
CREATE INDEX "Parameter_modelVersionId_sortOrder_idx" ON "Parameter"("modelVersionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Parameter_modelVersionId_code_key" ON "Parameter"("modelVersionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Parameter_modelVersionId_name_key" ON "Parameter"("modelVersionId", "name");

-- CreateIndex
CREATE INDEX "Subparameter_parameterId_sortOrder_idx" ON "Subparameter"("parameterId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Subparameter_parameterId_code_key" ON "Subparameter"("parameterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Subparameter_parameterId_name_key" ON "Subparameter"("parameterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPeriod_code_key" ON "AssessmentPeriod"("code");

-- CreateIndex
CREATE INDEX "AssessmentPeriod_startsAt_idx" ON "AssessmentPeriod"("startsAt");

-- CreateIndex
CREATE INDEX "AssessmentInput_assessmentPeriodId_idx" ON "AssessmentInput"("assessmentPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentInput_assessmentPeriodId_subparameterId_key" ON "AssessmentInput"("assessmentPeriodId", "subparameterId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_createdAt_idx" ON "ScoreSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreSnapshot_assessmentPeriodId_modelVersionId_key" ON "ScoreSnapshot"("assessmentPeriodId", "modelVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParameterResult_snapshotId_parameterId_key" ON "ParameterResult"("snapshotId", "parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "SubparameterResult_parameterResultId_subparameterId_key" ON "SubparameterResult"("parameterResultId", "subparameterId");

-- CreateIndex
CREATE INDEX "Remediation_status_priority_idx" ON "Remediation"("status", "priority");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ReportDownload_downloadedAt_idx" ON "ReportDownload"("downloadedAt");

-- AddForeignKey
ALTER TABLE "Parameter" ADD CONSTRAINT "Parameter_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subparameter" ADD CONSTRAINT "Subparameter_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentInput" ADD CONSTRAINT "AssessmentInput_assessmentPeriodId_fkey" FOREIGN KEY ("assessmentPeriodId") REFERENCES "AssessmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentInput" ADD CONSTRAINT "AssessmentInput_subparameterId_fkey" FOREIGN KEY ("subparameterId") REFERENCES "Subparameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentInput" ADD CONSTRAINT "AssessmentInput_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_assessmentPeriodId_fkey" FOREIGN KEY ("assessmentPeriodId") REFERENCES "AssessmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterResult" ADD CONSTRAINT "ParameterResult_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ScoreSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterResult" ADD CONSTRAINT "ParameterResult_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubparameterResult" ADD CONSTRAINT "SubparameterResult_parameterResultId_fkey" FOREIGN KEY ("parameterResultId") REFERENCES "ParameterResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubparameterResult" ADD CONSTRAINT "SubparameterResult_subparameterId_fkey" FOREIGN KEY ("subparameterId") REFERENCES "Subparameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_subparameterId_fkey" FOREIGN KEY ("subparameterId") REFERENCES "Subparameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDownload" ADD CONSTRAINT "ReportDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

