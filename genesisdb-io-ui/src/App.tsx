import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react";
import Editor from '@monaco-editor/react';

// Type for window.genesisConnection
declare global {
  interface Window {
    genesisConnection?: {
      host: string;
      authToken: string;
      name: string;
    };
  }
}

function App() {
  // Default input values for each endpoint
  const endpointDefaults: Record<string, string> = {
    '/api/v1/commit': `{
  "events": [
    {
      "source": "io.genesisdb.app",
      "subject": "/customer",
      "type": "io.genesisdb.app.customer-added",
      "data": {
        "firstName": "Bruce",
        "lastName": "Wayne",
        "emailAddress": "bruce.wayne@enterprise.wayne"
      }
    },
    {
      "source": "io.genesisdb.app",
      "subject": "/customer",
      "type": "io.genesisdb.app.customer-added",
      "data": {
        "firstName": "Alfred",
        "lastName": "Pennyworth",
        "emailAddress": "alfred.pennyworth@enterprise.wayne"
      }
    },
    {
      "source": "io.genesisdb.store",
      "subject": "/article",
      "type": "io.genesisdb.store.article-added",
      "data": {
        "name": "Tumbler",
        "color": "black",
        "price": 2990000.00
      }
    },
    {
      "source": "io.genesisdb.app",
      "subject": "/customer/fed2902d-0135-460d-8605-263a06308448",
      "type": "io.genesisdb.app.customer-personaldata-changed",
      "data": {
        "firstName": "Angus",
        "lastName": "MacGyver",
        "emailAddress": "angus.macgyer@phoenix.foundation"
      }
    }
  ]
}`,
    '/api/v1/stream': '{\n  "subject": "/"\n}',
    '/api/v1/query': `{
  "query": "STREAM e FROM events WHERE e.subject UNDER '/user' ORDER BY e.time MAP { id: e.id, firstName: e.data.firstName }"
}`,
    '/api/v1/observe': '{\n  "subject": "/"\n}',
    '/api/v1/erase': '{\n  "subject": "/user/456"\n}',
    '/api/v1/schema/register': `{
  "type": "io.genesisdb.app.customer-registrated",
  "schema": {
    "properties": {
      "firstName": { "type": "string", "required": true },
      "lastName": { "type": "string", "required": true },
      "emailAddress": { "type": "string", "required": true },
      "phoneNumber": { "type": "string" }
    },
    "allowAdditionalProperties": true
  }
}`,
    '/api/v1/schema/get': '',
    '/api/v1/subjects': '',
    '/api/v1/types': '',
    '/api/v1/backup/restore': `[
  {
    "source": "io.genesisdb.app",
    "subject": "/role/c63bd3d5-a49e-44d1-8637-ded8c2e50d46",
    "type": "io.genesisdb.app.role-added",
    "specversion": "1.0",
    "id": "ac138b87-ea2c-4790-ae35-b726052c6117",
    "time": "2025-06-02T15:40:01.157792875Z",
    "datacontenttype": "application/json",
    "predecessorhash": "0000000000000000000000000000000000000000000000000000000000000000",
    "data": {
      "name": "Administrator"
    },
    "hash": "80caff98e8f12f0f489cddf9aca21840cebff952610d53c5546864ba0c505f1c"
  },
  {
    "source": "io.genesisdb.app",
    "subject": "/user/6b6f5aa7-56b5-42ba-b093-fe6e921c863d",
    "type": "io.genesisdb.app.user-added",
    "specversion": "1.0",
    "id": "d8605ee4-9507-4974-8a2a-190baaea2b50",
    "time": "2025-06-02T15:40:01.188557875Z",
    "datacontenttype": "application/json",
    "predecessorhash": "80caff98e8f12f0f489cddf9aca21840cebff952610d53c5546864ba0c505f1c",
    "data": {
      "emailAddress": "bruce.wayne@enterprise.wayne",
      "firstName": "Bruce",
      "lastName": "Wayne"
    },
    "hash": "ed937741bec97bec0f22e6203f09370241f996274116b7ea2d798ebbe5fbb1ca"
  },
  {
    "source": "io.genesisdb.app",
    "subject": "/user/fed2902d-0135-460d-8605-263a06308448",
    "type": "io.genesisdb.app.user-added",
    "specversion": "1.0",
    "id": "d8605ee4-9507-4974-8a2a-190baaea2b50",
    "time": "2025-06-02T15:40:01.188557875Z",
    "datacontenttype": "application/json",
    "predecessorhash": "ed937741bec97bec0f22e6203f09370241f996274116b7ea2d798ebbe5fbb1ca",
    "data": {
      "emailAddress": "angus.macgyer@phoenix.foundation",
      "firstName": "Angus",
      "lastName": "MacGyer"
    },
    "hash": "b5699862763ac25d1725977e6937a855d7cad22b8a2b6670f320c559311a0147"
  }
]`
  };

  const [input, setInput] = useState<string>('{\n  "subject": "/"\n}');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [themeReady, setThemeReady] = useState<boolean>(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/stream');
  const [leftWidth, setLeftWidth] = useState<number>(50);
  const [topHeight, setTopHeight] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(window.innerWidth >= 1024);

  // Store input and output for each endpoint
  const [endpointContent, setEndpointContent] = useState<Record<string, { input: string; output: string }>>({});

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const connection = window.genesisConnection || {
    host: 'http://localhost:8080',
    authToken: 'secret',
    name: 'Local Development'
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('black-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
      }
    });
    setThemeReady(true);
  };

  const makeRequest = async (endpoint: string, body?: string) => {
    if (!connection) {
      setOutput(JSON.stringify({ error: 'No connection configured' }, null, 2));
      return;
    }

    setLoading(true);
    setOutput('');

    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("Authorization", `Bearer ${connection.authToken}`);

      const options: RequestInit = {
        method: endpoint === '/api/v1/subjects' || endpoint === '/api/v1/types' || endpoint === '/api/v1/schema/get' || endpoint === '/api/v1/status' ? "GET" : "POST",
        headers: headers,
        redirect: "follow"
      };

      if (body && options.method === "POST") {
        options.body = body;
      }

      const response = await fetch(`${connection.host}${endpoint}`, options);
      const result = await response.text();

      // Check if response is NDJSON (newline delimited JSON)
      if (result.includes('\n') && result.trim()) {
        try {
          // Parse each line as JSON and format individually
          const lines = result.trim().split('\n').filter(line => line.trim());
          const formatted = lines
            .map(line => JSON.stringify(JSON.parse(line), null, 4))
            .join('\n');
          setOutput(formatted);
        } catch (e) {
          // If NDJSON parsing fails, try regular JSON
          try {
            const parsed = JSON.parse(result);
            const formatted = JSON.stringify(parsed, null, 4);
            setOutput(formatted);
          } catch {
            // If all fails, show as plain text
            setOutput(result || '// Empty response');
          }
        }
      } else {
        // Try to parse as regular JSON
        try {
          const parsed = JSON.parse(result);
          const formatted = JSON.stringify(parsed, null, 4);
          setOutput(formatted);
        } catch (e) {
          // If not JSON, show as plain text
          setOutput(result || '// Empty response');
        }
      }
    } catch (error) {
      setOutput(JSON.stringify({ error: String(error) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedEndpoint) {
      setOutput(JSON.stringify({ error: 'Please select an action first' }, null, 2));
      return;
    }

    const needsBody = !['/api/v1/subjects', '/api/v1/types', '/api/v1/schema/get', '/api/v1/status'].includes(selectedEndpoint);
    makeRequest(selectedEndpoint, needsBody ? input : undefined);
  };

  const selectEndpoint = (endpoint: string) => {
    // Save current content before switching
    if (selectedEndpoint) {
      setEndpointContent(prev => ({
        ...prev,
        [selectedEndpoint]: { input, output }
      }));
    }

    // Restore content for the new endpoint or use defaults
    const saved = endpointContent[endpoint];
    if (saved) {
      setInput(saved.input);
      setOutput(saved.output);
    } else {
      // Set default input/output for new endpoint
      setInput(endpointDefaults[endpoint] || '');
      setOutput('');
    }

    setSelectedEndpoint(endpoint);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    if (isWideScreen) {
      // Horizontal dragging for side-by-side layout
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    } else {
      // Vertical dragging for stacked layout
      const newTopHeight = ((e.clientY - rect.top) / rect.height) * 100;
      if (newTopHeight > 20 && newTopHeight < 80) {
        setTopHeight(newTopHeight);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="dark flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b p-4 flex flex-row items-center justify-between">
        <svg width="172" height="28" viewBox="0 0 1647 210" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1436.54 0C1440.79 1.01719e-05 1442.92 2.12687 1442.92 6.37988V127.82C1442.92 138.234 1439.69 146.594 1433.24 152.9C1426.93 159.207 1418.57 162.36 1408.16 162.36H1293.76C1283.35 162.36 1274.91 159.207 1268.46 152.9C1262.15 146.594 1259 138.234 1259 127.82V82.5C1259 72.0868 1262.15 63.7265 1268.46 57.4199C1274.91 51.1134 1283.35 47.96 1293.76 47.96H1414.1V6.37988C1414.1 2.12686 1416.23 0 1420.48 0H1436.54ZM1303 73.2607C1298.31 73.2607 1294.57 74.6538 1291.78 77.4404C1289.14 80.0804 1287.82 83.7471 1287.82 88.4404V121.88C1287.82 126.573 1289.14 130.314 1291.78 133.101C1294.57 135.74 1298.31 137.061 1303 137.061H1398.92C1403.61 137.061 1407.28 135.74 1409.92 133.101C1412.71 130.314 1414.1 126.573 1414.1 121.88V88.4404C1414.1 83.7471 1412.71 80.0804 1409.92 77.4404C1407.28 74.6538 1403.61 73.2607 1398.92 73.2607H1303Z" fill="#00B5D4" />
          <path d="M1485.34 0C1489.59 0 1491.72 2.12686 1491.72 6.37988V47.96H1612.06C1622.47 47.9601 1630.91 51.1134 1637.36 57.4199C1643.67 63.7265 1646.82 72.0868 1646.82 82.5V127.82C1646.82 138.234 1643.67 146.594 1637.36 152.9C1630.91 159.207 1622.47 162.36 1612.06 162.36H1497.66C1487.25 162.36 1478.89 159.207 1472.58 152.9C1466.13 146.594 1462.9 138.234 1462.9 127.82V6.37988C1462.9 2.12686 1465.03 0 1469.28 0H1485.34ZM1506.9 73.2607C1502.21 73.2607 1498.54 74.6538 1495.9 77.4404C1493.11 80.0804 1491.72 83.7471 1491.72 88.4404V121.88C1491.72 126.573 1493.11 130.314 1495.9 133.101C1498.54 135.74 1502.21 137.061 1506.9 137.061H1602.82C1607.51 137.061 1611.25 135.74 1614.04 133.101C1616.68 130.314 1618 126.573 1618 121.88V88.4404C1618 83.7471 1616.68 80.0804 1614.04 77.4404C1611.25 74.6538 1607.51 73.2608 1602.82 73.2607H1506.9Z" fill="#00B5D4" />
          <path d="M353.618 47.9604C363.884 47.9604 371.658 50.6738 376.938 56.1005C382.364 61.3805 385.078 69.0805 385.078 79.2005V84.9204C385.078 95.1871 382.364 102.96 376.938 108.24C371.658 113.52 363.884 116.16 353.618 116.16H232.178V121.88C232.178 126.574 233.498 130.314 236.138 133.1C238.924 135.74 242.664 137.06 247.358 137.06H373.198C377.451 137.06 379.578 139.187 379.578 143.44V155.98C379.578 160.234 377.451 162.36 373.198 162.36H238.118C227.704 162.36 219.271 159.207 212.818 152.9C206.511 146.594 203.358 138.234 203.358 127.82V82.5005C203.358 72.0871 206.511 63.7271 212.818 57.4205C219.271 51.1138 227.704 47.9604 238.118 47.9604H353.618ZM232.178 94.1605H346.358C350.024 94.1605 352.591 93.3538 354.058 91.7405C355.524 89.9805 356.258 87.4871 356.258 84.2605V83.1605C356.258 79.7871 355.524 77.2938 354.058 75.6805C352.591 74.0671 350.024 73.2605 346.358 73.2605H247.358C242.664 73.2605 238.924 74.6538 236.138 77.4405C233.498 80.0804 232.178 83.7471 232.178 88.4405V94.1605Z" fill="white" />
          <path d="M403.986 82.5005C403.986 72.0871 407.14 63.7271 413.446 57.4205C419.753 51.1138 428.113 47.9604 438.526 47.9604H548.746C559.16 47.9604 567.52 51.1138 573.826 57.4205C580.133 63.7271 583.286 72.0871 583.286 82.5005V155.98C583.286 160.234 581.16 162.36 576.906 162.36H560.846C556.74 162.36 554.686 160.234 554.686 155.98V88.4405C554.686 83.7471 553.293 80.0804 550.506 77.4405C547.866 74.6538 544.2 73.2605 539.506 73.2605H447.766C443.073 73.2605 439.333 74.6538 436.546 77.4405C433.906 80.0804 432.586 83.7471 432.586 88.4405V155.98C432.586 160.234 430.46 162.36 426.206 162.36H410.146C406.04 162.36 403.986 160.234 403.986 155.98V82.5005Z" fill="white" />
          <path d="M753.962 47.9604C764.228 47.9604 772.002 50.6738 777.282 56.1005C782.708 61.3805 785.422 69.0805 785.422 79.2005V84.9204C785.422 95.1871 782.708 102.96 777.282 108.24C772.002 113.52 764.228 116.16 753.962 116.16H632.522V121.88C632.522 126.574 633.842 130.314 636.482 133.1C639.268 135.74 643.008 137.06 647.702 137.06H773.542C777.795 137.06 779.922 139.187 779.922 143.44V155.98C779.922 160.234 777.795 162.36 773.542 162.36H638.462C628.048 162.36 619.615 159.207 613.162 152.9C606.855 146.594 603.702 138.234 603.702 127.82V82.5005C603.702 72.0871 606.855 63.7271 613.162 57.4205C619.615 51.1138 628.048 47.9604 638.462 47.9604H753.962ZM632.522 94.1605H746.702C750.368 94.1605 752.935 93.3538 754.402 91.7405C755.868 89.9805 756.602 87.4871 756.602 84.2605V83.1605C756.602 79.7871 755.868 77.2938 754.402 75.6805C752.935 74.0671 750.368 73.2605 746.702 73.2605H647.702C643.008 73.2605 639.268 74.6538 636.482 77.4405C633.842 80.0804 632.522 83.7471 632.522 88.4405V94.1605Z" fill="white" />
          <path d="M812.29 162.36C808.037 162.36 805.91 160.234 805.91 155.98V143.44C805.91 139.187 808.037 137.06 812.29 137.06H943.41C947.077 137.06 949.643 136.254 951.11 134.64C952.577 133.027 953.31 130.534 953.31 127.16V126.06C953.31 122.834 952.577 120.414 951.11 118.8C949.643 117.04 947.077 116.16 943.41 116.16H833.85C813.023 116.16 802.61 105.747 802.61 84.9204V79.2005C802.61 69.0805 805.25 61.3805 810.53 56.1005C815.81 50.6738 823.583 47.9604 833.85 47.9604H970.25C974.357 47.9604 976.41 50.0871 976.41 54.3405V66.8805C976.41 71.1338 974.357 73.2605 970.25 73.2605H841.11C837.443 73.2605 834.877 74.0671 833.41 75.6805C831.943 77.2938 831.21 79.7871 831.21 83.1605V84.2605C831.21 87.4871 831.943 89.9805 833.41 91.7405C834.877 93.3538 837.443 94.1605 841.11 94.1605H950.67C971.497 94.1605 981.91 104.574 981.91 125.4V131.12C981.91 141.24 979.27 149.014 973.99 154.44C968.71 159.72 960.937 162.36 950.67 162.36H812.29Z" fill="white" />
          <path d="M1066.18 162.36C1061.93 162.36 1059.8 160.234 1059.8 155.98V143.44C1059.8 139.187 1061.93 137.06 1066.18 137.06H1197.3C1200.97 137.06 1203.53 136.254 1205 134.64C1206.47 133.027 1207.2 130.534 1207.2 127.16V126.06C1207.2 122.834 1206.47 120.414 1205 118.8C1203.53 117.04 1200.97 116.16 1197.3 116.16H1087.74C1066.91 116.16 1056.5 105.747 1056.5 84.9204V79.2005C1056.5 69.0805 1059.14 61.3805 1064.42 56.1005C1069.7 50.6738 1077.47 47.9604 1087.74 47.9604H1224.14C1228.25 47.9604 1230.3 50.0871 1230.3 54.3405V66.8805C1230.3 71.1338 1228.25 73.2605 1224.14 73.2605H1095C1091.33 73.2605 1088.77 74.0671 1087.3 75.6805C1085.83 77.2938 1085.1 79.7871 1085.1 83.1605V84.2605C1085.1 87.4871 1085.83 89.9805 1087.3 91.7405C1088.77 93.3538 1091.33 94.1605 1095 94.1605H1204.56C1225.39 94.1605 1235.8 104.574 1235.8 125.4V131.12C1235.8 141.24 1233.16 149.014 1227.88 154.44C1222.6 159.72 1214.83 162.36 1204.56 162.36H1066.18Z" fill="white" />
          <path d="M149.16 48.3604C159.573 48.3604 167.934 51.5137 174.24 57.8203C180.694 64.127 183.92 72.4871 183.92 82.9004V172C183.92 183.587 180.473 192.753 173.58 199.5C166.687 206.247 157.52 209.62 146.08 209.62H14.0801C9.82694 209.62 7.7002 207.493 7.7002 203.24V191.801C7.7002 187.548 9.82694 185.42 14.0801 185.42H138.82C143.954 185.42 147.914 183.954 150.7 181.021C153.634 178.234 155.101 174.2 155.101 168.92V162.388C153.201 162.635 151.221 162.761 149.16 162.761H34.7607C24.3474 162.761 15.9133 159.607 9.45996 153.301C3.15336 146.994 6.93102e-05 138.634 0 128.221V82.9004C0 72.4872 3.15342 64.127 9.45996 57.8203C15.9133 51.5136 24.3474 48.3604 34.7607 48.3604H149.16ZM44 73.6602C39.3068 73.6602 35.5669 75.0542 32.7803 77.8408C30.1405 80.4808 28.8203 84.1477 28.8203 88.8408V122.28C28.8203 126.973 30.1404 130.713 32.7803 133.5C35.5669 136.14 39.3068 137.46 44 137.46H139.92C144.613 137.46 148.28 136.14 150.92 133.5C153.707 130.713 155.101 126.974 155.101 122.28V88.8408C155.101 84.1475 153.707 80.4808 150.92 77.8408C148.28 75.0541 144.613 73.6602 139.92 73.6602H44Z" fill="white" />
          <rect width="29" height="114.4" rx="6" transform="matrix(1 0 0 -1 1004 162)" fill="white" />
          <rect width="29" height="29" rx="6" transform="matrix(1 0 0 -1 1004 29)" fill="white" />
        </svg>
        {connection && (
          <p className="text-sm text-muted-foreground text-end">
            Connected to: <span className="text-foreground">{connection.name} ({connection.host})</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row items-center gap-4 p-4 border-b">
        <div className="flex flex-row gap-1 overflow-x-auto flex-1 scrollbar-thin py-1">
          <Button onClick={() => selectEndpoint('/api/v1/commit')} disabled={loading} variant={selectedEndpoint === '/api/v1/commit' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Commit</Button>
          <Button onClick={() => selectEndpoint('/api/v1/stream')} disabled={loading} variant={selectedEndpoint === '/api/v1/stream' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Stream</Button>
          <Button onClick={() => selectEndpoint('/api/v1/query')} disabled={loading} variant={selectedEndpoint === '/api/v1/query' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Query</Button>
          {/* <Button onClick={() => selectEndpoint('/api/v1/observe')} disabled={loading} variant={selectedEndpoint === '/api/v1/observe' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Observe</Button> */}
          <Button onClick={() => selectEndpoint('/api/v1/erase')} disabled={loading} variant={selectedEndpoint === '/api/v1/erase' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Erase</Button>
          <Button onClick={() => selectEndpoint('/api/v1/schema/register')} disabled={loading} variant={selectedEndpoint === '/api/v1/schema/register' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Register Schema</Button>
          <Button onClick={() => selectEndpoint('/api/v1/schema/get')} disabled={loading} variant={selectedEndpoint === '/api/v1/schema/get' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Get Schemas</Button>
          <Button onClick={() => selectEndpoint('/api/v1/subjects')} disabled={loading} variant={selectedEndpoint === '/api/v1/subjects' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Get Subjects</Button>
          <Button onClick={() => selectEndpoint('/api/v1/types')} disabled={loading} variant={selectedEndpoint === '/api/v1/types' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Get Types</Button>
          <Button onClick={() => selectEndpoint('/api/v1/status')} disabled={loading} variant={selectedEndpoint === '/api/v1/status' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Status</Button>
          <Button onClick={() => selectEndpoint('/api/v1/backup/restore')} disabled={loading} variant={selectedEndpoint === '/api/v1/backup/restore' ? 'default' : 'outline'} size="sm" className="whitespace-nowrap">Restore Backup</Button>
        </div>
        <div className="flex flex-row flex-shrink-0">
          <Button onClick={handleSubmit} disabled={loading || !selectedEndpoint} size="sm">Submit</Button>
        </div>
      </div>

      {/* Editors */}
      <div
        className="flex flex-col lg:flex-row flex-1 overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Input Editor */}
        <div className="flex flex-col lg:border-r" style={{ width: isWideScreen ? `${leftWidth}%` : '100%', height: isWideScreen ? '100%' : `${topHeight}%` }}>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={input}
              onChange={(value) => setInput(value || '')}
              theme={themeReady ? "black-theme" : "vs-dark"}
              beforeMount={handleEditorWillMount}
              options={{
                readOnly: selectedEndpoint === '/api/v1/schema/get' || selectedEndpoint === '/api/v1/subjects' || selectedEndpoint === '/api/v1/types' || selectedEndpoint === '/api/v1/status',
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Draggable Divider */}
        <div
          className={isWideScreen ? "w-[2px] bg-border hover:bg-primary cursor-col-resize transition-colors flex-shrink-0" : "h-[3px] bg-border hover:bg-primary cursor-row-resize transition-colors flex-shrink-0"}
          onMouseDown={handleMouseDown}
          style={{ cursor: isWideScreen ? 'col-resize' : 'row-resize', pointerEvents: 'auto', zIndex: 10 }}
        />

        {/* Output Editor */}
        <div className="flex flex-col" style={{ width: isWideScreen ? `${100 - leftWidth}%` : '100%', height: isWideScreen ? '100%' : `${100 - topHeight}%` }}>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={output}
              theme={themeReady ? "black-theme" : "vs-dark"}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
