import React, { useState, useEffect, useRef } from 'react';
import '../styles/DrawingCanvas.css';

const DrawingCanvas = ({ children, isDrawingMode, externalClearCanvas, externalSetBrushColor, externalSetBrushSize }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
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

  return (
    <>
      <canvas ref={canvasRef} onMouseDown={onStartDrawing} onMouseUp={onEndDrawing} onMouseMove={handleDraw} 
        onMouseLeave={onEndDrawing} className={`drawing-canvas ${isDrawingMode ? 'drawing-active' : ''}`}/>
      
      {children}
    </>
  );
};

export default DrawingCanvas;