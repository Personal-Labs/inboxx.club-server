-- CreateTable
CREATE TABLE "inboxes" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "inbox_id" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "from_name" TEXT,
    "to_address" TEXT NOT NULL,
    "subject" TEXT,
    "s3_raw_key" TEXT NOT NULL,
    "s3_html_key" TEXT,
    "s3_text_key" TEXT,
    "text_preview" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_events" (
    "id" TEXT NOT NULL,
    "message_id" TEXT,
    "s3_raw_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inboxes_username_key" ON "inboxes"("username");

-- CreateIndex
CREATE INDEX "inboxes_expires_at_idx" ON "inboxes"("expires_at");

-- CreateIndex
CREATE INDEX "messages_inbox_id_received_at_idx" ON "messages"("inbox_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "messages_received_at_idx" ON "messages"("received_at");

-- CreateIndex
CREATE INDEX "messages_expires_at_idx" ON "messages"("expires_at");

-- CreateIndex
CREATE INDEX "attachments_message_id_idx" ON "attachments"("message_id");

-- CreateIndex
CREATE INDEX "inbound_events_processed_at_idx" ON "inbound_events"("processed_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "inboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
