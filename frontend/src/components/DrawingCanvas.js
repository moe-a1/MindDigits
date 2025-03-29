import React, { useState, useEffect, useRef } from 'react';
import '../styles/DrawingCanvas.css';

const DrawingCanvas = ({ children, onDrawingModeChange }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  useEffect(() => {
    if (onDrawingModeChange) {
      onDrawingModeChange(isDrawingMode);
    }
  }, [isDrawingMode, onDrawingModeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const setupCanvas = () => {
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      contextRef.current = context;
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    return () => window.removeEventListener('resize', setupCanvas);
  }, [brushColor, brushSize]);

  const isEventWithinElement = (event, element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  const onStartDrawing = (e) => {
    if (!isDrawingMode) return;
    
    const header = document.querySelector('.game-header');
    if (header && isEventWithinElement(e, header)) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  const onEndDrawing = () => {
    if (!isDrawingMode || !isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleDraw = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    
    const header = document.querySelector('.game-header');
    if (header && isEventWithinElement(e, header)) {
      onEndDrawing();
      return;
    }
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (isDrawing) {
      setIsDrawing(false);
      contextRef.current?.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const updateBrushColor = (e) => {
    const newColor = e.target.value;
    setBrushColor(newColor);
    if (contextRef.current) {
      contextRef.current.strokeStyle = newColor;
    }
  };
  const updateBrushSize = (e) => {
    const newSize = Number(e.target.value);
    setBrushSize(newSize);
    if (contextRef.current) {
      contextRef.current.lineWidth = newSize;
    }
  };

  return (
    <>
      <canvas ref={canvasRef} onMouseDown={onStartDrawing} onMouseUp={onEndDrawing} onMouseMove={handleDraw} 
        onMouseLeave={onEndDrawing} className={`drawing-canvas ${isDrawingMode ? 'drawing-active' : ''}`}/>
      
      <div id="drawing-controls-container">
        <div className="drawing-controls">
          <button className={`drawing-toggle ${isDrawingMode ? 'active' : ''}`} onClick={toggleDrawingMode}>
            {isDrawingMode ? 'Exit Drawing' : 'Draw'}
          </button>
          {isDrawingMode && (
            <>
              <input type="color" value={brushColor} onChange={updateBrushColor} className="color-picker"/>
              <input type="range" min="1" max="20" value={brushSize} onChange={updateBrushSize} className="brush-size-slider"/>
              <button onClick={clearCanvas} className="clear-button">Clear</button>
            </>
          )}
        </div>
      </div>
      
      {children}
    </>
  );
};

export default DrawingCanvas;