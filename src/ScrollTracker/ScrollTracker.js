import React, { useEffect, useReducer, useRef, useState } from 'react';
import _ from 'lodash';

const trackerReducer = (state, action) => {
  if (action.type === 'SET_SCROLL_POSITIONS') {
    return { 
      scrollPositions: action.scrollPositions, 
      chapterCount: action.chapterCount 
    };
  }
};

const ScrollTracker = () => {
  const jumpOffset = 45;
  const scrollOffset = .40;
  const [trackerState, dispatchTracker] = useReducer(trackerReducer);
  const [chapters, setChapters] = useState([]);
  const mainWrapperRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    fetch('./chapters.json')
      .then(res => res.json())
      .then(res => {
        setChapters(res.data);
      });
  }, []);

  useEffect(() => {
    if (chapters.length) {
      const scrollPosArr = Array.from(mainWrapperRef.current.querySelectorAll('.chapters__title'), el => {
        const title = el.querySelector('h2').textContent;
        return {
          title: title,
          y: el.offsetTop
        };
      });
      dispatchTracker({ 
        type: 'SET_SCROLL_POSITIONS', 
        scrollPositions: scrollPosArr, 
        chapterCount: chapters.length
      });
    }
  }, [chapters]);

  const jumpToChapter = () => {
    
  };

  return (
    <>
       <ul className="chapters__nav" ref={navRef}>
        {chapters.map((item, index) => {
          return (
            <li key={`chapter${index + 1}`} className="chapters__nav-item">
              <a 
                href={`#chapter${index + 1}`} 
                className="chapters__nav-link"
                onClick={jumpToChapter}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="main-wrapper" ref={mainWrapperRef}>
        {chapters.map((item, index) => {
          return (
            <div 
              key={`chapter${index + 1}`} 
              id={`chapter${index + 1}`} 
              className="chapters__title"
            >
              <h2>{item.title}</h2>
              <div dangerouslySetInnerHTML={{__html: item.content}} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ScrollTracker;
