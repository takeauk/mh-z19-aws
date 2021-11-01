import sys
sys.path.append("packages/") # 追加パッケージのインストール先
import logging
import time
import os
import json
import mh_z19

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

while True:
    out = mh_z19.read(serial_console_untouched=True)
    logger.info(out)

    co2 = out["co2"]
    time.sleep(600)

def handler(event, context):
  return
