/*
  現在時刻を表示するコンポーネント
  こんな感じのが出る-> 2026/06/12 15:42
*/

import { useState, useEffect } from 'react';
import { Text } from 'react-native';

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime =
    `${now.getFullYear()}/` +
    `${String(now.getMonth() + 1).padStart(2, "0")}/` +
    `${String(now.getDate()).padStart(2, "0")} ` +
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <Text>
      {formattedTime}
    </Text>
  );
}