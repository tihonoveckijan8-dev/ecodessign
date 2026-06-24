(function() {
    const isMobile = window.innerWidth <= 900;

    /* ================================================================
     * TAB SWITCHING
     * Event delegation on body: one listener handles all nav tabs.
     * No per-button listeners needed.
     * ================================================================ */
    const desktopNav = document.getElementById('desktopNav');
    const mobileMenuContainer = document.getElementById('mobileMenuContainer');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const header = document.getElementById('header');
    const tabContents = document.querySelectorAll('.tab-content');
    const indicator = document.querySelector('.tab-indicator');

    // Cache DOM lookups — avoid repeated querySelector calls
    const navTabsAll = document.querySelectorAll('.nav-tab');
    const tabHome = document.getElementById('tab-home');

    function updateIndicator(tabElement) {
        if (!indicator || window.innerWidth <= 900) return;
        // Batch reads to avoid layout thrashing
        const tabRect = tabElement.getBoundingClientRect();
        const parentRect = desktopNav.getBoundingClientRect();
        indicator.style.width = tabRect.width + 'px';
        indicator.style.left = (tabRect.left - parentRect.left) + 'px';
        indicator.style.height = tabRect.height + 'px';
        indicator.style.top = (tabRect.top - parentRect.top) + 'px';
    }

    function switchTab(tabId) {
        // Single pass: remove active from all, add to target
        for (let i = 0; i < navTabsAll.length; i++) {
            navTabsAll[i].classList.toggle('active', navTabsAll[i].getAttribute('data-tab') === tabId);
        }
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].classList.toggle('active', tabContents[i].id === 'tab-' + tabId);
        }
        closeMobileMenu();
        if (window.innerWidth > 900) {
            const activeTab = desktopNav.querySelector('.nav-tab.active');
            if (activeTab) updateIndicator(activeTab);
        }
        if (history.pushState) history.pushState(null, null, '#' + tabId);
    }

    function populateMobileMenu() {
        const desktopBtns = desktopNav.querySelectorAll('.nav-tab');
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < desktopBtns.length; i++) {
            const clone = desktopBtns[i].cloneNode(true);
            clone.classList.remove('active');
            fragment.appendChild(clone);
        }
        mobileMenuContainer.innerHTML = '';
        mobileMenuContainer.appendChild(fragment);
    }
    populateMobileMenu();

    function openMobileMenu() {
        mobileOverlay.classList.add('show');
        mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
        document.body.style.overflow = 'hidden';
        const activeId = desktopNav.querySelector('.nav-tab.active')?.getAttribute('data-tab');
        if (activeId) {
            const mobileBtns = mobileMenuContainer.querySelectorAll('.nav-tab');
            for (let i = 0; i < mobileBtns.length; i++) {
                mobileBtns[i].classList.toggle('active', mobileBtns[i].getAttribute('data-tab') === activeId);
            }
        }
    }

    function closeMobileMenu() {
        mobileOverlay.classList.remove('show');
        mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        document.body.style.overflow = '';
    }

    // Event delegation — one listener for all nav clicks
    document.body.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.nav-tab');
        if (tabBtn) {
            e.preventDefault();
            const tabId = tabBtn.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        }
    });

    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        mobileOverlay.classList.contains('show') ? closeMobileMenu() : openMobileMenu();
    });

    mobileOverlay.addEventListener('click', function(e) {
        if (e.target === mobileOverlay) closeMobileMenu();
    });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileOverlay.classList.contains('show')) closeMobileMenu();
        });

            document.getElementById('logoLink').addEventListener('click', function(e) {
                e.preventDefault();
                switchTab('home');
            });

            /* ================================================================
             * THROTTLED SCROLL — rAF-based, no layout thrashing
             * Reads scrollY once per frame, writes classList once.
             * ================================================================ */
            let scrollTicking = false;
            window.addEventListener('scroll', function() {
                if (!scrollTicking) {
                    requestAnimationFrame(function() {
                        header.classList.toggle('scrolled', window.scrollY > 10);
                        scrollTicking = false;
                    });
                    scrollTicking = true;
                }
            }, { passive: true });

            /* ================================================================
             * DEBOUNCED RESIZE — already 100ms, kept as-is
             * ================================================================ */
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    const activeTab = desktopNav.querySelector('.nav-tab.active');
                    if (activeTab && window.innerWidth > 900) updateIndicator(activeTab);
                    toggleDotsOnMobile();
                }, 100);
            }, { passive: true });

            function toggleDotsOnMobile() {
                const dotsContainer = document.getElementById('sliderDots');
                if (!dotsContainer) return;
                dotsContainer.style.display = window.innerWidth <= 900 ? 'none' : 'flex';
            }

            /* ================================================================
             * LAZY SLIDER — builds slides on demand, not all 29 at once.
             * Only the active slide + 1 neighbor are in DOM.
             * ================================================================ */
            const slider = document.getElementById('slider');
            const prevBtn = document.getElementById('prevSlide');
            const nextBtn = document.getElementById('nextSlide');
            const dotsContainer = document.getElementById('sliderDots');
            const counter = document.getElementById('sliderCounter');

            if (slider && prevBtn && nextBtn) {
                const START_NUM = 4;
                const END_NUM = 32;
                const IMG_PATH = 'photos/';
                const IMG_EXT = '.png';
                const totalSlides = END_NUM - START_NUM + 1;
                let currentIndex = 0;

                // Pre-create slide cache — only create DOM nodes when needed
                const slideCache = new Array(totalSlides);

                function createSlide(photoNumber) {
                    const slide = document.createElement('div');
                    slide.className = 'slide';
                    const img = document.createElement('img');
                    img.src = IMG_PATH + photoNumber + IMG_EXT;
                    img.alt = 'Фото ' + photoNumber;
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.width = 1200;
                    img.height = 750;
                    img.addEventListener('error', function() {
                        img.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'slide-placeholder';
                        placeholder.textContent = '📸 Фото ' + photoNumber + ' (не найдено)';
                        placeholder.style.background = 'hsl(' + (photoNumber * 18 % 360) + ', 70%, 35%)';
                        slide.prepend(placeholder);
                    });
                    const caption = document.createElement('div');
                    caption.className = 'slide-caption';
                    slide.appendChild(img);
                    slide.appendChild(caption);
                    return slide;
                }

                function ensureSlide(index) {
                    if (!slideCache[index]) {
                        slideCache[index] = createSlide(START_NUM + index);
                    }
                    return slideCache[index];
                }

                function updateSlider() {
                    // Remove all active slides
                    const active = slider.querySelectorAll('.slide.active');
                    for (let i = 0; i < active.length; i++) active[i].classList.remove('active');

                    // Ensure current slide exists and activate it
                    const slide = ensureSlide(currentIndex);
                    slide.classList.add('active');
                    if (!slide.parentNode) slider.appendChild(slide);

                    // Update dots
                    if (dotsContainer && dotsContainer.style.display !== 'none') {
                        const dots = dotsContainer.children;
                        for (let i = 0; i < dots.length; i++) {
                            dots[i].classList.toggle('active', i === currentIndex);
                        }
                    }
                    if (counter) {
                        counter.textContent = (currentIndex + 1) + ' / ' + totalSlides;
                    }
                }

                function createDots() {
                    if (!dotsContainer) return;
                    const fragment = document.createDocumentFragment();
                    for (let i = 0; i < totalSlides; i++) {
                        const dot = document.createElement('div');
                        dot.className = 'dot';
                        if (i === currentIndex) dot.classList.add('active');
                        dot.addEventListener('click', function() {
                            currentIndex = i;
                            updateSlider();
                        });
                        fragment.appendChild(dot);
                    }
                    dotsContainer.innerHTML = '';
                    dotsContainer.appendChild(fragment);
                }

                // Build only what's needed immediately
                ensureSlide(0);
                slider.appendChild(slideCache[0]);
                createDots();
                updateSlider();
                toggleDotsOnMobile();

                prevBtn.addEventListener('click', function() {
                    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                    updateSlider();
                });
                nextBtn.addEventListener('click', function() {
                    currentIndex = (currentIndex + 1) % totalSlides;
                    updateSlider();
                });

                // Touch — passive for perf
                let touchStartX = 0;
                slider.addEventListener('touchstart', function(e) {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });
                slider.addEventListener('touchend', function(e) {
                    const diff = e.changedTouches[0].screenX - touchStartX;
                    if (Math.abs(diff) > 50) {
                        currentIndex = diff < 0
                        ? (currentIndex + 1) % totalSlides
                        : (currentIndex - 1 + totalSlides) % totalSlides;
                        updateSlider();
                    }
                }, { passive: true });
            }

            /* ================================================================
             * ROUTE BUILDER — lazy, only binds if elements exist
             * ================================================================ */
            const buildBtn = document.getElementById('buildRouteBtn');
            const startInput = document.getElementById('startPoint');
            if (buildBtn && startInput) {
                const destination = 'Минск, ул. Макаёнка, 8';
                buildBtn.addEventListener('click', function() {
                    const start = startInput.value.trim();
                    if (!start) { alert('Пожалуйста, введите точку отправления'); return; }
                    window.open('https://yandex.ru/maps/?rtext=' + encodeURIComponent(start) + '~' + encodeURIComponent(destination) + '&rtt=auto', '_blank');
                });
            }

            /* ================================================================
             * HASH RESTORE — immediate, needed for first paint
             * ================================================================ */
            function restoreFromHash() {
                const hash = window.location.hash.slice(1);
                const validTabs = ['home','history','teacher','gallery','works','program','directions'];
                switchTab(validTabs.indexOf(hash) !== -1 ? hash : 'home');
            }
            restoreFromHash();
            window.addEventListener('hashchange', restoreFromHash);

            /* ================================================================
             * WINDOW LOAD — indicator update + dots toggle
             * ================================================================ */
            window.addEventListener('load', function() {
                if (indicator && window.innerWidth > 900) {
                    const activeTab = desktopNav.querySelector('.nav-tab.active');
                    if (activeTab) updateIndicator(activeTab);
                }
                toggleDotsOnMobile();
            });

            /* ================================================================
             * MICROCHIP ENERGY VEINS — touch interaction
             * Long press on chip area → accelerate current + boost glow.
             * Uses CSS class toggle on .mc-layer for GPU-accelerated boost.
             * ================================================================ */
            if (isMobile) {
                const mcLayers = document.querySelectorAll('.mc-layer');
                mcLayers.forEach(function(layer) {
                    let boostTimer = null;
                    let isActive = false;

                    function activateBoost() {
                        if (isActive) return;
                        isActive = true;
                        layer.classList.add('mc-boost');
                    }

                    function deactivateBoost() {
                        isActive = false;
                        layer.classList.remove('mc-boost');
                        if (boostTimer) {
                            clearTimeout(boostTimer);
                            boostTimer = null;
                        }
                    }

                    // Long press: 400ms hold activates boost
                    layer.addEventListener('touchstart', function(e) {
                        boostTimer = setTimeout(activateBoost, 400);
                    }, { passive: true });

                    layer.addEventListener('touchend', deactivateBoost, { passive: true });
                    layer.addEventListener('touchcancel', deactivateBoost, { passive: true });

                    // Prevent context menu on long press
                    layer.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                    });
                });
            }

            /* ================================================================
             * CLICK LEAF ANIMATION — object pool, requestAnimationFrame
             * ================================================================ */
            const leafPool = [];
            const maxLeaves = isMobile ? 15 : 30;

            function createLeaf() {
                const leaf = document.createElement('div');
                leaf.className = 'click-leaf';
                leaf.textContent = '🍃';
                return leaf;
            }

            function getLeaf() {
                return leafPool.length > 0 ? leafPool.pop() : createLeaf();
            }

            function recycleLeaf(leaf) {
                if (leafPool.length < maxLeaves) {
                    leaf.style.display = 'none';
                    leafPool.push(leaf);
                } else {
                    leaf.remove();
                }
            }

            const clickLeafCount = isMobile ? 1 : 3;
            document.addEventListener('click', function(e) {
                requestAnimationFrame(function() {
                    for (let i = 0; i < clickLeafCount; i++) {
                        const leaf = getLeaf();
                        leaf.style.display = '';
                        leaf.style.left = (e.clientX + (Math.random() - 0.5) * 20) + 'px';
                        leaf.style.top = (e.clientY + (Math.random() - 0.5) * 20) + 'px';
                        leaf.style.setProperty('--dx', (Math.random() - 0.5) * 80 + 'px');
                        leaf.style.setProperty('--dy', -(30 + Math.random() * 50) + 'px');
                        leaf.style.setProperty('--rot', (Math.random() * 360) + 'deg');
                        leaf.style.animationDelay = (i * 0.05) + 's';
                        document.body.appendChild(leaf);

                        (function(l) {
                            function onEnd() {
                                l.removeEventListener('animationend', onEnd);
                                l.style.animation = 'none';
                                l.offsetHeight; // force reflow
                                l.style.animation = '';
                                recycleLeaf(l);
                            }
                            l.addEventListener('animationend', onEnd);
                        })(leaf);
                    }
                });
            }, { passive: true });
})();
