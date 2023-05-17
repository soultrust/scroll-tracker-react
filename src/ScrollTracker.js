import React, { useCallback, useEffect, useRef, useState } from 'react';
import _ from 'lodash';

const jumpOffset = 10;
const scrollOffset = .60;

const easeOutQuart = (t, b, c, d) => {
  t /= d;
  t--;
  return -c * (t * t * t * t - 1) + b;
};

const ScrollTracker = () => {
  const [chapters, setChapters] = useState([]);
  const mainWrapperRef = useRef(null);
  const navRef = useRef(null);
  const scrollPositions = useRef([]);
  const chapterCount = useRef(null);
  const isAutoScrolling = useRef(false);
  const highlightedChapter = useRef(null);
  const windowHeight = useRef(window.innerHeight);
  const currScrollPos = useRef(0);
  const chapterElements = useRef([]);

  const scrollTo = (target, duration) => {
    const startPosition = window.pageYOffset; // Initial scroll position
    const targetPosition = target.offsetTop - jumpOffset; // Target scroll position
    const distance = targetPosition - startPosition; // Distance to scroll
    const startTime = performance.now(); // Start time of animation
  
    function step(timestamp) {
      const currentTime = timestamp - startTime; // Elapsed time
  
      // Calculate the new scroll position using the easing function
      window.scrollTo(0, easeOutQuart(currentTime, startPosition, distance, duration));
  
      // Check if the animation is finished
      if (currentTime < duration) {
        // Continue the animation
        requestAnimationFrame(step);
      } else {
        // Animation completed
        window.scrollTo(0, targetPosition);
        isAutoScrolling.current = false;
      }
    }
  
    // Start the animation
    requestAnimationFrame(step);
  };

  const jumpToChapter = (event) => {
    isAutoScrolling.current = true;
    const navlink = event.target;
    
    if (window.location.pathname.replace(/^\//,'') === navlink.pathname.replace(/^\//,'') 
        && window.location.hostname === navlink.hostname) {

      let target = document.querySelector(navlink.hash);

      target = target ? target : document.querySelector('[name=' + navlink.hash.slice(1) +']');
      highlightChapter(parseInt(navlink.hash.replace(/#chapter/, '')));
      
      if (target) {
        scrollTo(target, 1000);
      }
    }
  };

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

    if (chapterNum && typeof chapterNum === 'number') {
      chapterToHighlight = chapterNum - 1;
    }
    else {
      if (isAutoScrolling.current) { return false; }
      chapterToHighlight = getChapterToHighlight();
    }
    if (highlightedChapter === chapterToHighlight) { return false; }

    const nav = navRef.current;
    const active = nav.querySelector('.is-active');
    if (active) {
      active.classList.remove('is-active');
    }
    const navItems = Array.from(nav.querySelectorAll('.chapters__nav-item'));
    if (navItems[chapterToHighlight]) {
      navItems[chapterToHighlight].classList.add('is-active');
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

  // Re-initialize function to handle window resize
  const init = useCallback(() => {
    windowHeight.current = window.innerHeight;

    // Only update y coords of chapter titles
    scrollPositions.current.forEach((pos, index) => {
      scrollPositions.current[index].y = Math.round(
        chapterElements.current[index].offsetTop
      );
    });
  }, []);

  useEffect(() => {
    if (chapters.length) {
      chapterElements.current = [...mainWrapperRef.current.querySelectorAll('.chapter')];
      const scrollPosArr = chapterElements.current.map(el => {
        const title = el.querySelector('.chapter__title').textContent;
        return {
          title: title,
          y: Math.round(el.offsetTop)
        };
      });
      
      scrollPositions.current = scrollPosArr;
      chapterCount.current = chapters.length;
      const throttled_highlightChapter = _.throttle(highlightChapter, 300);
      window.addEventListener('scroll', throttled_highlightChapter);
      const debounced_init = _.debounce(init, 800);
      window.addEventListener('resize', debounced_init);
      highlightChapter();
    }
  }, [chapters, highlightChapter, init]);

  return (
    <>
       <ul id="chapters__nav" ref={navRef}>
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
      <div id="chapters__wrapper" ref={mainWrapperRef}>
        {chapters.map((item, index) => {
          return (
            <div 
              key={`chapter${index + 1}`} 
              id={`chapter${index + 1}`} 
              className="chapter"
            >
              <h2 className="chapter__title">{item.title}</h2>
              <div dangerouslySetInnerHTML={{__html: item.content}} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ScrollTracker;
