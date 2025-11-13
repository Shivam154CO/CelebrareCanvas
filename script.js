document.addEventListener('DOMContentLoaded', function() {
    const swiper = new Swiper('.swiper-container', {
        direction: 'horizontal',
        loop: false,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            slideChange: function() {
                updateNavigation();
                updateTextList();
                updateCurrentSlide();
            }
        }
    });

    function updateCurrentSlide() {
        document.getElementById('currentSlide').textContent = swiper.activeIndex + 1;
    }

    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-index'));
            swiper.slideTo(slideIndex);
        });
    });

    function updateNavigation() {
        indicators.forEach((indicator, index) => {
            if (index === swiper.activeIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    let textElements = [];
    let activeTextElement = null;
    const textList = document.getElementById('textList');
    const addTextBtn = document.getElementById('addTextBtn');
    const textContent = document.getElementById('textContent');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const textColor = document.getElementById('textColor');
    const colorPreview = document.getElementById('colorPreview');
    const bgColor = document.getElementById('bgColor');
    const bgColorPreview = document.getElementById('bgColorPreview');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const prevSlideBtn = document.getElementById('prevSlide');
    const nextSlideBtn = document.getElementById('nextSlide');
    const fontOptions = document.querySelectorAll('.font-option');
    const alignButtons = document.querySelectorAll('.align-btn');
    const elementCount = document.getElementById('elementCount');

    fontSize.addEventListener('input', function() {
        fontSizeValue.textContent = this.value + 'px';
        if (activeTextElement) {
            activeTextElement.style.fontSize = this.value + 'px';
        }
    });

    textColor.addEventListener('input', function() {
        const color = this.value;
        colorPreview.querySelector('.color-swatch').style.backgroundColor = color;
        colorPreview.querySelector('span').textContent = color.toUpperCase();
        if (activeTextElement) {
            activeTextElement.style.color = color;
        }
    });

    bgColor.addEventListener('input', function() {
        const color = this.value;
        bgColorPreview.querySelector('.color-swatch').style.backgroundColor = color;
        bgColorPreview.querySelector('span').textContent = color.toUpperCase();
        if (activeTextElement) {
            activeTextElement.style.backgroundColor = color;
        }
    });

    fontOptions.forEach(option => {
        option.addEventListener('click', function() {
            fontOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            if (activeTextElement) {
                activeTextElement.style.fontFamily = this.getAttribute('data-font');
            }
        });
    });

    alignButtons.forEach(button => {
        button.addEventListener('click', function() {
            alignButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            if (activeTextElement) {
                activeTextElement.style.textAlign = this.getAttribute('data-align');
            }
        });
    });

    addTextBtn.addEventListener('click', function() {
        const currentSlide = swiper.slides[swiper.activeIndex];
        
        const newText = document.createElement('div');
        newText.className = 'draggable-text';
        newText.textContent = textContent.value || 'New Text';
        newText.style.fontFamily = document.querySelector('.font-option.active').getAttribute('data-font');
        newText.style.fontSize = fontSize.value + 'px';
        newText.style.color = textColor.value;
        newText.style.backgroundColor = bgColor.value;
        newText.style.textAlign = document.querySelector('.align-btn.active').getAttribute('data-align') || 'center';
        newText.style.padding = '16px 20px';
        newText.style.borderRadius = '12px';
        newText.style.position = 'absolute';
        newText.style.cursor = 'move';
        newText.style.zIndex = '10';

        const slideRect = currentSlide.getBoundingClientRect();
        const existingTexts = textElements.filter(t => t.slideIndex === swiper.activeIndex);
        
        const offset = existingTexts.length * 30;
        const leftPx = Math.max(20, Math.floor(slideRect.width / 2 - 100 + offset));
        const topPx = Math.max(20, Math.floor(slideRect.height / 2 - 30 + offset));

        newText.style.left = leftPx + 'px';
        newText.style.top = topPx + 'px';

        currentSlide.appendChild(newText);
        
        makeDraggable(newText);

        const textObj = {
            element: newText,
            slideIndex: swiper.activeIndex
        };
        textElements.push(textObj);
        textContent.value = 'New Text';

        updateTextList();
        updateElementCount();
        
        showToast('Text element added successfully!');
    });

    function makeDraggable(element) {
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        let resizeHandle = element.querySelector('.resize-handle');
        if (!resizeHandle) {
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            element.appendChild(resizeHandle);
        }

        element.addEventListener('pointerdown', startPointerInteraction);
        resizeHandle.addEventListener('pointerdown', startPointerResize);

        function disableSwiper() { swiper.allowTouchMove = false; }
        function enableSwiper() { swiper.allowTouchMove = true; }

        function startPointerInteraction(e) {
            if (e.target === element) {
                disableSwiper();
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = element.offsetLeft;
                startTop = element.offsetTop;

                element.setPointerCapture(e.pointerId);
                document.addEventListener('pointermove', drag);
                document.addEventListener('pointerup', stopInteraction);
                
                const textObj = textElements.find(t => t.element === element);
                if (textObj) {
                    selectTextElement(textObj);
                }
                e.preventDefault();
            }
        }

        function startPointerResize(e) {
            disableSwiper();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseFloat(getComputedStyle(element).width);
            startHeight = parseFloat(getComputedStyle(element).height);

            element.setPointerCapture(e.pointerId);
            document.addEventListener('pointermove', resize);
            document.addEventListener('pointerup', stopInteraction);
            e.stopPropagation();
            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const container = element.parentElement;
            const maxLeft = container.clientWidth - element.offsetWidth;
            const maxTop = container.clientHeight - element.offsetHeight;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
        }

        function resize(e) {
            if (!isResizing) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(80, startWidth + deltaX);
            const newHeight = Math.max(40, startHeight + deltaY);

            const parent = element.parentElement;
            const maxW = parent.clientWidth - element.offsetLeft;
            const maxH = parent.clientHeight - element.offsetTop;

            element.style.width = Math.min(newWidth, maxW) + 'px';
            element.style.height = Math.min(newHeight, maxH) + 'px';
        }

        function stopInteraction(e) {
            isDragging = false;
            isResizing = false;
            enableSwiper();

            try {
                document.removeEventListener('pointermove', drag);
                document.removeEventListener('pointermove', resize);
                document.removeEventListener('pointerup', stopInteraction);
            } catch (err) {}
            try { element.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        element.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const textObj = textElements.find(t => t.element === element);
            if (textObj) {
                selectTextElement(textObj);
            }
        });
    }

    function selectTextElement(textObj) {
        textElements.forEach(t => {
            t.element.classList.remove('text-active');
        });

        textObj.element.classList.add('text-active');
        activeTextElement = textObj.element;

        textContent.value = textObj.element.textContent;

        const currentFont = textObj.element.style.fontFamily || '';
        fontOptions.forEach(option => {
            if (option.getAttribute('data-font') === currentFont) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        const sizeMatch = (textObj.element.style.fontSize || '').match(/(\d+)px/);
        if (sizeMatch) {
            fontSize.value = sizeMatch[1];
            fontSizeValue.textContent = sizeMatch[1] + 'px';
        }

        const currentAlign = textObj.element.style.textAlign || 'center';
        alignButtons.forEach(button => {
            if (button.getAttribute('data-align') === currentAlign) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        const computedStyle = getComputedStyle(textObj.element);
        textColor.value = rgbToHex(computedStyle.color) || '#ffffff';
        bgColor.value = rgbToHex(computedStyle.backgroundColor) || '#8b5a2b';
        
        colorPreview.querySelector('.color-swatch').style.backgroundColor = textColor.value;
        colorPreview.querySelector('span').textContent = textColor.value.toUpperCase();
        bgColorPreview.querySelector('.color-swatch').style.backgroundColor = bgColor.value;
        bgColorPreview.querySelector('span').textContent = bgColor.value.toUpperCase();
        updateTextList();
    }

    textContent.addEventListener('input', function() {
        if (activeTextElement) {
            activeTextElement.textContent = this.value;
            if (!activeTextElement.querySelector('.resize-handle')) {
                const rh = document.createElement('div');
                rh.className = 'resize-handle';
                activeTextElement.appendChild(rh);
                makeDraggable(activeTextElement);
            }
            updateTextList();
            updateElementCount();
        }
    });

    function updateTextList() {
        const currentSlideIndex = swiper.activeIndex;
        const currentTexts = textElements.filter(t => t.slideIndex === currentSlideIndex);

        if (currentTexts.length === 0) {
            textList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-text-slash"></i>
                    </div>
                    <p>No text elements</p>
                    <span>Add some text to get started</span>
                </div>
            `;
            return;
        }

        textList.innerHTML = '';

        currentTexts.forEach((textObj, index) => {
            const textItem = document.createElement('div');
            textItem.className = 'text-item';
            if (textObj.element === activeTextElement) {
                textItem.classList.add('active');
            }

            textItem.innerHTML = `
                <span>${textObj.element.textContent}</span>
                <span class="delete-text"><i class="fas fa-trash"></i></span>
            `;

            textItem.addEventListener('click', function(e) {
                if (e.target.classList.contains('delete-text') || e.target.classList.contains('fa-trash')) {
                    textObj.element.remove();
                    textElements = textElements.filter(t => t !== textObj);
                    if (activeTextElement === textObj.element) {
                        activeTextElement = null;
                        textContent.value = '';
                    }
                    updateTextList();
                    updateElementCount();
                } else {
                    selectTextElement(textObj);
                }
            });

            textList.appendChild(textItem);
        });
    }

    function updateElementCount() {
        const currentSlideIndex = swiper.activeIndex;
        const currentTexts = textElements.filter(t => t.slideIndex === currentSlideIndex);
        elementCount.textContent = currentTexts.length;
    }

    resetBtn.addEventListener('click', function() {
        const currentSlideIndex = swiper.activeIndex;

        textElements = textElements.filter(t => {
            if (t.slideIndex === currentSlideIndex) {
                t.element.remove();
                return false;
            }
            return true;
        });

        activeTextElement = null;
        textContent.value = '';
        updateTextList();
        updateElementCount();
    });

    downloadBtn.addEventListener('click', function() {
        showToast('Design saved successfully!');
    });

    prevSlideBtn.addEventListener('click', function() {
        swiper.slidePrev();
    });

    nextSlideBtn.addEventListener('click', function() {
        swiper.slideNext();
    });

    function rgbToHex(rgb) {
        if (!rgb) return null;
        if (rgb.startsWith && rgb.startsWith('#')) return rgb;

        const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
        if (!result) return '#8b5a2b';

        const r = parseInt(result[1]);
        const g = parseInt(result[2]);
        const b = parseInt(result[3]);

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('swiper-slide') || 
            e.target.classList.contains('slide-overlay') ||
            e.target.classList.contains('default-text')) {
            
            textElements.forEach(t => {
                t.element.classList.remove('text-active');
            });
            activeTextElement = null;
            textContent.value = '';
            updateTextList();
        }
    });

    setTimeout(() => {
        const defaultTexts = [
            {
                content: "Welcome to Canvas",
                slide: 0,
                top: 100,
                left: 80,
                font: "'Playfair Display', serif",
                size: "32",
                color: "#ffffff",
                bgColor: "#8b5a2b",
                align: "center"
            },
            {
                content: "Create beautiful designs",
                slide: 0,
                top: 180,
                left: 60,
                font: "'Great Vibes', cursive",
                size: "24",
                color: "#ffffff",
                bgColor: "rgba(139, 90, 43, 0.8)",
                align: "center"
            },
            {
                content: "Premium Editor",
                slide: 1,
                top: 120,
                left: 90,
                font: "'Playfair Display', serif",
                size: "28",
                color: "#ffffff",
                bgColor: "#8b5a2b",
                align: "center"
            },
            {
                content: "Unleash your creativity",
                slide: 1,
                top: 200,
                left: 50,
                font: "'Dancing Script', cursive",
                size: "22",
                color: "#ffffff",
                bgColor: "rgba(139, 90, 43, 0.8)",
                align: "center"
            },
            {
                content: "Professional Results",
                slide: 2,
                top: 140,
                left: 70,
                font: "Arial, sans-serif",
                size: "26",
                color: "#ffffff",
                bgColor: "#8b5a2b",
                align: "center"
            },
            {
                content: "Made with passion",
                slide: 2,
                top: 220,
                left: 80,
                font: "'Great Vibes', cursive",
                size: "20",
                color: "#ffffff",
                bgColor: "rgba(139, 90, 43, 0.8)",
                align: "center"
            }
        ];

        defaultTexts.forEach(text => {
            const slide = swiper.slides[text.slide];
            const newText = document.createElement('div');
            newText.className = 'draggable-text';
            newText.textContent = text.content;
            newText.style.fontFamily = text.font;
            newText.style.fontSize = text.size + 'px';
            newText.style.color = text.color;
            newText.style.backgroundColor = text.bgColor;
            newText.style.textAlign = text.align;
            newText.style.padding = '16px 20px';
            newText.style.borderRadius = '12px';
            newText.style.position = 'absolute';
            newText.style.cursor = 'move';

            newText.style.left = text.left + 'px';
            newText.style.top = text.top + 'px';

            slide.appendChild(newText);
            makeDraggable(newText);

            textElements.push({
                element: newText,
                slideIndex: text.slide
            });
        });

        updateTextList();
        updateElementCount();
        updateCurrentSlide();
    }, 1000);

});
