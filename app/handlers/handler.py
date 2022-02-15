import sys
sys.path.append("packages/") # 追加パッケージのインストール先
import logging
import time
import json
import mh_z19
import greengrasssdk

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

client = greengrasssdk.client('iot-data')
topic = 'metrics/co2'

def create_payload(co2):
    return json.dumps({
      "value": co2,
      "timestamp": time.time()
    })

def publish_message(payload):
  logger.info(payload)
  client.publish(topic=topic, payload=payload)


while True:
    metric = mh_z19.read(serial_console_untouched=True)
    logger.info(metric)

    payload = create_payload(metric["co2"])
    publish_message(payload)

    # TODO Want to get interval from iot cloud paramter.
    time.sleep(600)

def handler(event, context):
  return
