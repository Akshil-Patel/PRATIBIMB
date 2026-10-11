document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // ==========================================
    // 1. HERO ANIMATIONS
    // ==========================================
    const heroTl = gsap.timeline();
    
    heroTl.from(".hero-bg-accent", {
        y: "-100%",
        duration: 1,
        ease: "power3.out"
    })
    .from(".sub-heading", {
        opacity: 0,
        y: 20,
        duration: 0.6
    }, "-=0.4")
    .from(".main-heading", {
        opacity: 0,
        scale: 0.8,
        rotation: 4,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.2")
    .from(".tagline", {
        opacity: 0,
        y: -15,
        duration: 0.5
    }, "-=0.4")
    .from(".hero-badges", {
        opacity: 0,
        y: 15,
        duration: 0.5
    }, "-=0.3")
    .from(".scroll-prompt", {
        opacity: 0,
        duration: 0.8
    }, "-=0.2");

    // ==========================================
    // 2. GLOBAL AUDIO MANAGEMENT
    // ==========================================
    let isGlobalAudioOn = false;
    const globalSoundBtn = document.getElementById("globalSoundToggle");
    const globalSoundText = globalSoundBtn ? globalSoundBtn.querySelector(".sound-text") : null;
    const videoSections = document.querySelectorAll("[data-video-section]");

    const updateAudioUI = () => {
        if (globalSoundBtn) {
            if (isGlobalAudioOn) {
                globalSoundBtn.classList.add("is-sound-on");
                if (globalSoundText) globalSoundText.textContent = "SOUND ON";
            } else {
                globalSoundBtn.classList.remove("is-sound-on");
                if (globalSoundText) globalSoundText.textContent = "SOUND OFF";
            }
        }

        // Update all scene sound buttons
        videoSections.forEach((section) => {
            const soundLabel = section.querySelector(".sound-status-label");
            const soundIcon = section.querySelector(".sound-icon-symbol");
            const fgVideo = section.querySelector(".video-foreground");

            if (isGlobalAudioOn) {
                section.classList.add("is-unmuted");
                if (soundLabel) soundLabel.textContent = "SOUND ACTIVE";
                if (soundIcon) soundIcon.textContent = "🔊";
                if (fgVideo && !section.classList.contains("is-paused")) {
                    fgVideo.muted = false;
                }
            } else {
                section.classList.remove("is-unmuted");
                if (soundLabel) soundLabel.textContent = "MUTED • TAP TO UNMUTE";
                if (soundIcon) soundIcon.textContent = "🔇";
                if (fgVideo) {
                    fgVideo.muted = true;
                }
            }
        });
    };

    const toggleGlobalAudio = () => {
        isGlobalAudioOn = !isGlobalAudioOn;
        updateAudioUI();
    };

    if (globalSoundBtn) {
        globalSoundBtn.addEventListener("click", toggleGlobalAudio);
    }

    // ==========================================
    // 3. FULLSCREEN VIDEOS - STICK TO TOP & AUTOPLAY
    // ==========================================
    let currentlyActiveSection = null;

    const playVideoSection = (section) => {
        if (!section) return;
        const fgVideo = section.querySelector(".video-foreground");
        const bgVideo = section.querySelector(".video-bg-ambient");

        if (fgVideo) {
            fgVideo.muted = !isGlobalAudioOn;
            
            const playPromise = fgVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    section.classList.add("is-playing");
                    section.classList.remove("is-paused");
                }).catch((err) => {
                    console.log("Autoplay waiting for interaction:", err);
                    fgVideo.muted = true;
                    fgVideo.play().then(() => {
                        section.classList.add("is-playing");
                        section.classList.remove("is-paused");
                    }).catch(() => {});
                });
            }
        }

        if (bgVideo) {
            bgVideo.muted = true;
            if (fgVideo) bgVideo.currentTime = fgVideo.currentTime;
            bgVideo.play().catch(() => {});
        }
    };

    const pauseVideoSection = (section) => {
        if (!section) return;
        const fgVideo = section.querySelector(".video-foreground");
        const bgVideo = section.querySelector(".video-bg-ambient");

        if (fgVideo && !fgVideo.paused) {
            fgVideo.pause();
        }
        if (bgVideo && !bgVideo.paused) {
            bgVideo.pause();
        }
        section.classList.remove("is-playing");
    };

    const activateSection = (section) => {
        if (currentlyActiveSection && currentlyActiveSection !== section) {
            pauseVideoSection(currentlyActiveSection);
        }
        currentlyActiveSection = section;
        playVideoSection(section);
        updateNavState(section.id);
    };

    const deactivateSection = (section) => {
        pauseVideoSection(section);
        if (currentlyActiveSection === section) {
            currentlyActiveSection = null;
        }
    };

    // Attach pin and scroll triggers to each video section
    videoSections.forEach((section) => {
        const fgVideo = section.querySelector(".video-foreground");
        const bgVideo = section.querySelector(".video-bg-ambient");
        const timelineFill = section.querySelector(".hud-timeline-fill");
        const timelineBar = section.querySelector(".hud-timeline-bar");
        const soundBtn = section.querySelector(".scene-sound-btn");
        const playBtn = section.querySelector(".play-pause-action");
        const hudCenter = section.querySelector(".hud-center");

        // Sound button click inside scene
        if (soundBtn) {
            soundBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleGlobalAudio();
            });
        }

        // Tap on video or center or play button to toggle play/pause
        const handlePlayToggle = (e) => {
            if (e) e.stopPropagation();
            if (!fgVideo) return;

            if (fgVideo.paused) {
                fgVideo.play().then(() => {
                    section.classList.add("is-playing");
                    section.classList.remove("is-paused");
                    if (bgVideo) bgVideo.play().catch(() => {});
                });
            } else {
                fgVideo.pause();
                section.classList.remove("is-playing");
                section.classList.add("is-paused");
                if (bgVideo) bgVideo.pause();
            }
        };

        if (fgVideo) fgVideo.addEventListener("click", handlePlayToggle);
        if (hudCenter) hudCenter.addEventListener("click", handlePlayToggle);
        if (playBtn) playBtn.addEventListener("click", handlePlayToggle);

        // Progress bar updates
        if (fgVideo && timelineFill) {
            fgVideo.addEventListener("timeupdate", () => {
                if (fgVideo.duration) {
                    const pct = (fgVideo.currentTime / fgVideo.duration) * 100;
                    timelineFill.style.width = `${pct}%`;
                }
            });
        }

        // Timeline seek click
        if (timelineBar && fgVideo) {
            timelineBar.addEventListener("click", (e) => {
                e.stopPropagation();
                const rect = timelineBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (fgVideo.duration) {
                    fgVideo.currentTime = pos * fgVideo.duration;
                    if (bgVideo) bgVideo.currentTime = fgVideo.currentTime;
                }
            });
        }

        // PIN TO TOP: When user scrolls to video, it sticks to the top of the screen and plays!
        ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: "+=100%",
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            onEnter: () => activateSection(section),
            onEnterBack: () => activateSection(section),
            onLeave: () => deactivateSection(section),
            onLeaveBack: () => deactivateSection(section)
        });
    });

    // ==========================================
    // 4. NAVBAR ACTIVE LINK TRACKING
    // ==========================================
    const allSections = document.querySelectorAll(".fullscreen-section");
    const navLinks = document.querySelectorAll(".nav-link");

    function updateNavState(currentId) {
        navLinks.forEach((link) => {
            if (link.dataset.nav === currentId) {
                link.classList.add("is-active");
            } else {
                link.classList.remove("is-active");
            }
        });
    }

    allSections.forEach((sec) => {
        ScrollTrigger.create({
            trigger: sec,
            start: "top center",
            end: "bottom center",
            onEnter: () => updateNavState(sec.id),
            onEnterBack: () => updateNavState(sec.id)
        });
    });

    // ==========================================
    // 5. THE TROUPE - PINNED HORIZONTAL GALLERY
    // ==========================================
    const troupeSection = document.querySelector(".troupe-section#troupe");

    if (troupeSection) {
        const pinWrap = troupeSection.querySelector(".pin-wrap");
        const mediaCards = troupeSection.querySelectorAll(".media-card");

        const getScrollAmount = () => -(pinWrap.scrollWidth - window.innerWidth);

        const troupeTween = gsap.to(pinWrap, {
            x: getScrollAmount,
            ease: "none"
        });

        ScrollTrigger.create({
            trigger: troupeSection,
            start: "top top",
            end: () => `+=${pinWrap.scrollWidth}`,
            pin: true,
            animation: troupeTween,
            scrub: 1,
            invalidateOnRefresh: true
        });

        // Parallax entrance tilt for group photo cards
        mediaCards.forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                scale: 0.85,
                rotation: i % 2 === 0 ? 5 : -5,
                scrollTrigger: {
                    trigger: card,
                    containerAnimation: troupeTween,
                    start: "left center+=250",
                    toggleActions: "play none none reverse"
                }
            });
        });
    }

    // ==========================================
    // 6. LIGHTBOX MODAL (FOR GROUP PHOTOS)
    // ==========================================
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const lightboxClose = document.querySelector(".lightbox-close");
    const photoCards = document.querySelectorAll("[data-lightbox]");

    const openLightbox = (imgSrc, captionText) => {
        if (!lightboxModal) return;
        lightboxImg.src = imgSrc;
        lightboxCaption.textContent = captionText || "";
        lightboxModal.classList.add("is-open");
        lightboxModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        if (!lightboxModal) return;
        lightboxModal.classList.remove("is-open");
        lightboxModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    };

    photoCards.forEach((card) => {
        card.addEventListener("click", () => {
            const imgSrc = card.dataset.lightbox;
            const caption = card.dataset.caption;
            openLightbox(imgSrc, caption);
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightboxModal) {
        lightboxModal.addEventListener("click", (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("is-open")) {
            closeLightbox();
        }
    });

    // Spacebar to toggle play/pause of currently active video
    document.addEventListener("keydown", (e) => {
        if (e.key === " " && !lightboxModal.classList.contains("is-open")) {
            if (currentlyActiveSection) {
                e.preventDefault();
                const fg = currentlyActiveSection.querySelector(".video-foreground");
                if (fg) {
                    if (fg.paused) {
                        fg.play();
                        currentlyActiveSection.classList.add("is-playing");
                        currentlyActiveSection.classList.remove("is-paused");
                    } else {
                        fg.pause();
                        currentlyActiveSection.classList.remove("is-playing");
                        currentlyActiveSection.classList.add("is-paused");
                    }
                }
            }
        }
    });
});
