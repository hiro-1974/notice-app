import { useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Circle } from "react-konva";

export default function App() {
  const [imageObj, setImageObj] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pendingPos, setPendingPos] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [mapName, setMapName] = useState("");

  const storageKey = mapName
    ? `noticeMarkers_${mapName}`
    : null;

  const [scale, setScale] = useState(1);

  const [zoomPercent, setZoomPercent] = useState(100);

  const [stagePos, setStagePos] = useState({
    x: 0,
    y: 0,
  });
 
useEffect(() => {
  if (!storageKey) return;

  const saved =
    localStorage.getItem(storageKey);

  if (saved) {
    setMarkers(JSON.parse(saved));
  } else {
    setMarkers([]);
  }
}, [storageKey]);

useEffect(() => {
  if (!storageKey) return;

  localStorage.setItem(
    storageKey,
    JSON.stringify(markers)
  );
}, [markers, storageKey]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMapName(file.name);

    const url = URL.createObjectURL(file);

    const img = new window.Image();
    img.src = url;

    img.onload = () => {
      setImageObj(img);
    };
  };

  const handleStageClick = (e) => {

  const stage =
    e.target.getStage();

  const pointer =
    stage.getPointerPosition();

  const pos = {
    x:
      (pointer.x - stagePos.x) /
      scale,

    y:
      (pointer.y - stagePos.y) /
      scale,
  };

    setSelectedMarker(null);

    setPendingPos({
      x: pos.x,
      y: pos.y,
    });
  };

  const handleWheel = (e) => {
  e.evt.preventDefault();

  const scaleBy = 1.1;

  const stage = e.target.getStage();
  const oldScale = stage.scaleX();

  const pointer = stage.getPointerPosition();

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  const newScale =
    e.evt.deltaY > 0
      ? oldScale / scaleBy
      : oldScale * scaleBy;

  setScale(newScale);

  setStagePos({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  });
};

  const zoomIn = () => {
    const newZoom = Math.min(
      zoomPercent + 20,
      300
    );

    setZoomPercent(newZoom);
    setScale(newZoom / 100);
  };

  const zoomOut = () => {
    const newZoom = Math.max(
      zoomPercent - 20,
      40
    );

    setZoomPercent(newZoom);
    setScale(newZoom / 100);
  };

  const addMarker = (status, color) => {
    if (!pendingPos) return;

    setMarkers([
      ...markers,
      {
        x: pendingPos.x,
        y: pendingPos.y,
        status,
        color,
      },
    ]);

    setPendingPos(null);
  };

  const updateMarker = (status, color) => {
    if (selectedMarker === null) return;

    const newMarkers = [...markers];

    newMarkers[selectedMarker] = {
      ...newMarkers[selectedMarker],
      status,
      color,
    };

    setMarkers(newMarkers);
    setSelectedMarker(null);
  };

  const deleteMarker = () => {
    if (selectedMarker === null) return;

    setMarkers(
      markers.filter((_, i) => i !== selectedMarker)
    );

    setSelectedMarker(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>お知らせ配布状況</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <button onClick={zoomOut}>
          －
        </button>

        <span>
          {zoomPercent}%
        </span>

        <button onClick={zoomIn}>
          ＋
        </button>
      </div>

      {mapName && (
        <div
          style={{
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          地図：{mapName}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {imageObj && (
        <div style={{ marginTop: "20px" }}>
          <Stage
            width={window.innerWidth - 50}
            height={window.innerHeight - 150}
            draggable
            x={stagePos.x}
            y={stagePos.y}
            scaleX={scale}
            scaleY={scale}
            onDragEnd={(e) =>
              setStagePos({
                x: e.target.x(),
                y: e.target.y(),
              })
            }
            onWheel={handleWheel}
            onClick={handleStageClick}
            onTap={handleStageClick}
           >
            <Layer>
              <KonvaImage
                image={imageObj}
                width={imageObj.width}
                height={imageObj.height}
              />

              {markers.map((m, i) => (
                <Circle
                  key={i}
                  x={m.x}
                  y={m.y}
                  radius={8}
                  fill={m.color}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setPendingPos(null);
                    setSelectedMarker(i);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setPendingPos(null);
                    setSelectedMarker(i);
                  }}
                />
                
              ))}
            </Layer>
          </Stage>
        </div>
      )}

      {pendingPos && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            right: 20,
            background: "#ffffff",
            border: "1px solid #ccc",
            padding: "10px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => addMarker("配布済", "green")}>
            配布済
          </button>

          <button onClick={() => addMarker("不在", "yellow")}>
            不在
          </button>

          <button onClick={() => addMarker("空家", "gray")}>
            空家
          </button>

          <button onClick={() => addMarker("拒否", "red")}>
            拒否
          </button>

          <button onClick={() => addMarker("再訪問", "blue")}>
            再訪問
          </button>

          <button onClick={() => setPendingPos(null)}>
            キャンセル
          </button>
        </div>
      )}

      {selectedMarker !== null && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "#ffffff",
            border: "1px solid #ccc",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <button onClick={() => updateMarker("配布済", "green")}>
            配布済
          </button>

          <button onClick={() => updateMarker("不在", "yellow")}>
            不在
          </button>

          <button onClick={() => updateMarker("空家", "gray")}>
            空家
          </button>

          <button onClick={() => updateMarker("拒否", "red")}>
            拒否
          </button>

          <button onClick={() => updateMarker("再訪問", "blue")}>
            再訪問
          </button>

          <button onClick={deleteMarker}>
            削除
          </button>

          <button onClick={() => setSelectedMarker(null)}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}