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
    // 2. USER GESTURE UNMUTED AUDIO UNLOCKER
    // ==========================================
    // Browsers require a user interaction (click/touch/scroll) before unmuted playback
    let userHasInteracted = false;
    const unlockAudio = () => {
        if (userHasInteracted) return;
        userHasInteracted = true;
        document.querySelectorAll(".video-foreground").forEach((v) => {
            v.muted = false;
        });
        if (currentlyActiveSection) {
            const activeFg = currentlyActiveSection.querySelector(".video-foreground");
            if (activeFg) {
                activeFg.muted = false;
                activeFg.play().catch(() => {});
            }
        }
    };

    ["pointerdown", "click", "touchstart", "keydown", "wheel"].forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });

    // ==========================================
    // 3. FULLSCREEN VIDEOS - STICK TO TOP & AUTOPLAY (UNMUTED)
    // ==========================================
    let currentlyActiveSection = null;
    const videoSections = document.querySelectorAll("[data-video-section]");

    const playVideoSection = (section) => {
        if (!section) return;
        const fgVideo = section.querySelector(".video-foreground");
        const bgVideo = section.querySelector(".video-bg-ambient");

        if (fgVideo) {
            // Keep videos unmuted only
            fgVideo.muted = false;
            
            const playPromise = fgVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    section.classList.add("is-playing");
                    section.classList.remove("is-paused");
                }).catch((err) => {
                    console.log("Unmuted autoplay restricted prior to interaction. Retrying on user interaction:", err);
                    // Fallback: play muted temporarily until interaction, then unlockAudio() unmutes it immediately
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
        const playBtn = section.querySelector(".play-pause-action");
        const hudCenter = section.querySelector(".hud-center");

        // Keep foreground video unmuted by default
        if (fgVideo) fgVideo.muted = false;

        // Tap on video or center or play button to toggle play/pause
        const handlePlayToggle = (e) => {
            if (e) e.stopPropagation();
            if (!fgVideo) return;

            unlockAudio();

            if (fgVideo.paused) {
                fgVideo.muted = false;
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
                unlockAudio();
                const rect = timelineBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (fgVideo.duration) {
                    fgVideo.currentTime = pos * fgVideo.duration;
                    if (bgVideo) bgVideo.currentTime = fgVideo.currentTime;
                }
            });
        }

        // PIN TO TOP: Video sticks to the top of the screen and covers the screen nicely
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
    // 4. THE TROUPE - PINNED HORIZONTAL GALLERY
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
    // 5. LIGHTBOX MODAL (FOR GROUP PHOTOS)
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
                unlockAudio();
                const fg = currentlyActiveSection.querySelector(".video-foreground");
                if (fg) {
                    if (fg.paused) {
                        fg.muted = false;
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
