import React, { useState, useEffect, useRef } from 'react';
import '../styles/DrawingCanvas.css';

const DrawingCanvas = ({ children, isDrawingMode, externalClearCanvas, externalSetBrushColor, externalSetBrushSize }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      contextRef.current = context;

      if (drawingHistory.length > 0 && currentHistoryIndex >= 0) {
        restoreCanvasState(currentHistoryIndex);
      } else if (drawingHistory.length === 0) {
        saveCanvasState();
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    return () => window.removeEventListener('resize', setupCanvas);
  }, [isDrawingMode, brushColor, brushSize, drawingHistory.length, currentHistoryIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDrawingMode && (e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, currentHistoryIndex]);

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

  const restoreCanvasState = (index) => {
    if (index < 0 || index >= drawingHistory.length || !canvasRef.current) return;
    
    const img = new Image();
    img.src = drawingHistory[index];
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const saveCanvasState = () => {
    if (!canvasRef.current) return;
    
    const currentState = canvasRef.current.toDataURL();
    
    if (currentHistoryIndex < drawingHistory.length - 1) {
      setDrawingHistory(prev => prev.slice(0, currentHistoryIndex + 1));
    }
    
    setDrawingHistory(prev => [...prev, currentState]);
    setCurrentHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (currentHistoryIndex <= 0 || !canvasRef.current) return;
    
    const newIndex = currentHistoryIndex - 1;
    setCurrentHistoryIndex(newIndex);
    restoreCanvasState(newIndex);
  };

  const getCanvasMousePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onStartDrawing = (e) => {
    if (!isDrawingMode || !contextRef.current) return;
    
    const header = document.querySelector('.game-header');
    if (header && isEventWithinElement(e, header)) return;
    
    const { x, y } = getCanvasMousePosition(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const onEndDrawing = () => {
    if (!isDrawingMode || !contextRef.current) return;
    
    if (isDrawing) {
      contextRef.current.closePath();
      setIsDrawing(false);
      
      saveCanvasState();
    }
  };

  const handleDraw = (e) => {
    if (!isDrawing || !isDrawingMode || !contextRef.current) return;
    
    const header = document.querySelector('.game-header');
    if (header && isEventWithinElement(e, header)) {
      onEndDrawing();
      return;
    }
    
    const { x, y } = getCanvasMousePosition(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (drawingHistory.length > 0 && drawingHistory[0].includes('data:image')) {
      setDrawingHistory([drawingHistory[0]]);
      setCurrentHistoryIndex(0);
    } else {
      const blankState = canvas.toDataURL();
      setDrawingHistory([blankState]);
      setCurrentHistoryIndex(0);
    }
  };

  const updateBrushColor = (newColor) => {
    setBrushColor(newColor);
    if (contextRef.current) {
      contextRef.current.strokeStyle = newColor;
    }
  };
  
  const updateBrushSize = (newSize) => {
    setBrushSize(newSize);
    if (contextRef.current) {
      contextRef.current.lineWidth = newSize;
    }
  };

  useEffect(() => {
    if (externalClearCanvas) {
      externalClearCanvas.current = clearCanvas;
    }
    if (externalSetBrushColor) {
      externalSetBrushColor.current = updateBrushColor;
    }
    if (externalSetBrushSize) {
      externalSetBrushSize.current = updateBrushSize;
    }
  }, [externalClearCanvas, externalSetBrushColor, externalSetBrushSize]);

  useEffect(() => {
    window.drawingCanvasUtils = {
      undo
    };
    
    return () => {
      window.drawingCanvasUtils = null;
    };
  }, [undo]);

  return (
    <>
      <canvas ref={canvasRef} onMouseDown={onStartDrawing} onMouseUp={onEndDrawing} onMouseMove={handleDraw} 
        onMouseLeave={onEndDrawing} className={`drawing-canvas ${isDrawingMode ? 'drawing-active' : ''}`}/>
      
      {children}
    </>
  );
};

export default DrawingCanvas;