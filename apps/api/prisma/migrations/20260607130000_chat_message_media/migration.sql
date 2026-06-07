ALTER TABLE "ChatMessage"
ADD COLUMN "mediaType" TEXT,
ADD COLUMN "mediaUrl" TEXT,
ADD COLUMN "mediaPublicId" TEXT,
ADD COLUMN "mediaWidth" INTEGER,
ADD COLUMN "mediaHeight" INTEGER,
ADD COLUMN "mediaBytes" INTEGER,
ADD COLUMN "mediaDurationSeconds" DOUBLE PRECISION;

ALTER TABLE "ChatMessage" ALTER COLUMN "text" SET DEFAULT '';
