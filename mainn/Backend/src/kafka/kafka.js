import { Kafka, logLevel } from 'kafkajs'

let kafka = null
let producer = null
let connected = false

const isEnabled = () => String(process.env.KAFKA_ENABLED || 'false').toLowerCase() === 'true'

export async function initKafka() {
  if (!isEnabled()) return { enabled: false }
  if (connected) return { enabled: true }
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092')
    .split(',')
    .map(b => b.trim())
    .filter(Boolean)
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'uber-clone-backend',
    brokers,
    logLevel: logLevel.NOTHING,
  })
  producer = kafka.producer({ allowAutoTopicCreation: true })
  await producer.connect()
  connected = true
  return { enabled: true }
}

export async function publishEvent(topic, key, value) {
  try {
    if (!isEnabled()) return
    if (!connected) await initKafka()
    const payload = {
      topic,
      messages: [{ key, value: typeof value === 'string' ? value : JSON.stringify(value) }],
    }
    await producer.send(payload)
  } catch (e) {
    // non-fatal: log and continue
    console.warn('Kafka publish failed:', e?.message)
  }
}

export async function shutdownKafka() {
  try {
    if (producer) await producer.disconnect()
  } catch {}
}
