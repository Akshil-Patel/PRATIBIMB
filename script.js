document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // ==========================================
    // HERO ANIMATIONS (Kept from previous)
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
        rotation: 5,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.2")
    .from(".tagline", {
        opacity: 0,
        y: -20,
        duration: 0.5
    }, "-=0.4")
    .from(".scroll-prompt", {
        opacity: 0,
        duration: 1
    }, "-=0.2");

    // ==========================================
    // HORIZONTAL SCROLL SECTIONS (The New Interaction)
    // ==========================================
    
    // We grab every dedicated art section
    const sections = gsap.utils.toArray('.art-section');

    sections.forEach((section) => {
        const pinWrap = section.querySelector('.pin-wrap');
        const mediaCards = section.querySelectorAll('.media-card');
        
        // Calculate the total scrollable distance for this section based on its content width
        const getScrollAmount = () => -(pinWrap.scrollWidth - window.innerWidth);
        
        // Create a tween that moves the pinWrap to the left
        const tween = gsap.to(pinWrap, {
            x: getScrollAmount,
            ease: "none"
        });

        // Link the tween to the scroll position
        ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: () => `+=${pinWrap.scrollWidth}`, // The scroll duration depends on how wide the content is
            pin: true,        // Pin the section
            animation: tween,
            scrub: 1,         // Smooth scrubbing
            invalidateOnRefresh: true // Recalculate if window is resized
        });

        // Add a parallax entrance effect to the media cards as they scroll into view
        mediaCards.forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                scale: 0.8,
                rotation: i % 2 === 0 ? 5 : -5, // Alternate slight rotation
                scrollTrigger: {
                    trigger: card,
                    containerAnimation: tween, // Ties this trigger to the horizontal movement!
                    start: "left center+=200", // When card comes in from the right
                    toggleActions: "play none none reverse"
                }
            });
        });
    });
});
