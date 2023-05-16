import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
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
  const scrollPositions = useRef([]);
  const chapterCount = useRef(null);
  const isAutoScrolling = useRef(false);
  const highlightedChapter = useRef(null);
  const windowHeight = useRef(window.innerHeight);
  const currScrollPos = useRef(0);

  const checkPos = (index) => {
    let totalOffset = windowHeight.current - (windowHeight.current * scrollOffset);
    currScrollPos.current = document.documentElement.scrollTop;

    if (scrollPositions.current[index+1] && 
        currScrollPos.current >= scrollPositions.current[index].y - totalOffset && 
        currScrollPos.current < scrollPositions.current[index+1].y - totalOffset) {
      return index;
    }
    else if (currScrollPos.current < scrollPositions.current[0].y - totalOffset) {
      return 0;
    } 
    else if (currScrollPos.current > scrollPositions.current[chapterCount.current-1].y - totalOffset) {
      return chapterCount.current - 1;
    } 
    else {
      return -1;
    }
  };

  const getChapterToHighlight = useCallback(() => {
    var returnValue;

    for (let i = 0; i < chapterCount.current; i++) {
      let result = checkPos(i);
      if (result >= 0) {
        returnValue = result;
        break;
      }
    }
    return returnValue;
  }, []);

  const highlightChapter = useCallback((chapterNum) => {
    let chapterToHighlight;
  //  debugger;
    if (typeof chapterNum === 'number') {
      chapterToHighlight = chapterNum - 1;
    }
    else {
      if (isAutoScrolling.current) { return false; }
      chapterToHighlight = getChapterToHighlight();
    }
    if (highlightedChapter === chapterToHighlight) { return false; }

    const nav = navRef.current;
    const active = nav.querySelector('.chapters__nav-item--active');
    if (active) {
      active.classList.remove('chapters__nav-item--active');
    }
    const navItems = Array.from(nav.querySelectorAll('.chapters__nav-item'));
    if (navItems[chapterToHighlight]) {
      navItems[chapterToHighlight].classList.add('chapters__nav-item--active');
    }
    highlightedChapter.current = chapterToHighlight;
  }, [getChapterToHighlight]);

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
      
      scrollPositions.current = scrollPosArr;
      chapterCount.current = chapters.length;
      const throttled_highlightChapter = _.throttle(highlightChapter, 400);
      window.addEventListener('scroll', throttled_highlightChapter);
      highlightChapter();
    }
  }, [chapters, highlightChapter]);

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
