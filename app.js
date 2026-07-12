// ================================================================
// 0. GSAP Eklentilerini En Başta Tanıtıyoruz 
// ================================================================
gsap.registerPlugin(ScrollTrigger);


// ================================================================
// 1. Gelişmiş Lenis ve GSAP ScrollTrigger Entegrasyonu
// ================================================================
const lenis = new Lenis({
    duration: 1.2, 
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    smoothWheel: true,
    orientation: 'vertical'
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000); 
});
gsap.ticker.lagSmoothing(0, 0);

document.querySelectorAll('.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        
        if (targetId && targetId.startsWith("#")) {
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                e.preventDefault(); 
                lenis.scrollTo(targetSection, {
                    duration: 1.5,
                    offset: -80 
                });
            }
        }
    });
});


// ================================================================
// 2. GSAP Yükleme Ekranı (Preloader) Animasyonu
// ================================================================
const counterElement = document.querySelector(".counter");
let counterValue = { val: 0 };

if (counterElement) {
    gsap.to(counterValue, {
        val: 100,
        duration: 2, 
        ease: "power2.inOut",
        onUpdate: function () {
            counterElement.innerText = Math.floor(counterValue.val) + "%";
        },
        onComplete: function () {
            gsap.to(".preloader", {
                y: "-100%",
                duration: 1.5,
                ease: "expo.inOut"
            });
            
            gsap.fromTo(".hero-title, .hero-subtitle", 
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.5 }
            );
        }
    });
} else {
    gsap.fromTo(".hero-title, .hero-subtitle", 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.5 }
    );
}


// ================================================================
// 3. Projeler İçin Scroll Animasyonu
// ================================================================
gsap.utils.toArray('.project-card').forEach(card => {
    gsap.fromTo(card, 
        { y: 100, opacity: 0 }, 
        {
            y: 0, 
            opacity: 1, 
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%", 
                toggleActions: "play none none reverse" 
            }
        }
    );
});

// ================================================================
// 3.1 Proje Kategori Filtreleri
// Sayfa ilk açıldığında tüm projeler gösterilir.
// ================================================================
const projectFilterButtons = document.querySelectorAll('.project-filter');
const projectCards = document.querySelectorAll('.project-card');
const projectFilterStatus = document.querySelector('.project-filter-status');
const projectsHeading = document.querySelector('#projects-heading');

const projectFilterLabels = {
    featured: 'Öne Çıkan Projeler',
    all: 'Tüm Projeler',
    mekanik: 'Mekanik Tasarım Projeleri',
    endustriyel: 'Endüstriyel Tasarım Projeleri',
    'yazilim-elektronik': 'Yazılım & Elektronik Projeleri',
    render: 'Render Çalışmaları',
    oyun: 'Oyun Projeleri'
};

function filterProjects(filter, animate = false) {
    let visibleCount = 0;

    projectCards.forEach(card => {
        const categories = (card.dataset.category || '').split(' ');
        const shouldShow = filter === 'all'
            || (filter === 'featured' && card.dataset.featured === 'true')
            || categories.includes(filter);

        if (shouldShow) {
            const wasHidden = card.hidden;
            card.hidden = false;
            visibleCount += 1;

            if (animate && wasHidden) {
                gsap.fromTo(card, { y: 24, opacity: 0 }, {
                    y: 0,
                    opacity: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
        } else {
            card.hidden = true;
        }
    });

    if (projectsHeading) projectsHeading.textContent = projectFilterLabels[filter] || 'Projeler';
    if (projectFilterStatus) projectFilterStatus.textContent = `${visibleCount} proje gösteriliyor`;
    ScrollTrigger.refresh();
}

projectFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
        projectFilterButtons.forEach(item => {
            const isActive = item === button;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-pressed', String(isActive));
        });
        filterProjects(button.dataset.filter, true);
    });
});

if (projectCards.length) filterProjects('all');


// ================================================================
// 4. Video Üzeri Kayan Yazılar Animasyonu (Sticky Scroll)
// ================================================================
gsap.utils.toArray('.scroll-text').forEach(text => {
    gsap.fromTo(text, 
        { opacity: 0, scale: 0.8 }, 
        { 
            opacity: 1, 
            scale: 1, 
            scrollTrigger: {
                trigger: text,
                start: "top center+=150", 
                end: "top center", 
                scrub: true 
            }
        }
    );

    gsap.to(text, {
        opacity: 0,
        scale: 1.2, 
        scrollTrigger: {
            trigger: text,
            start: "bottom center", 
            end: "bottom center-=150", 
            scrub: true
        }
    });
});


// ================================================================
// 5. Yetenek Çubukları (Progress Bars) Animasyonu
// ================================================================
gsap.utils.toArray('.progress').forEach(bar => {
    let targetWidth = bar.style.width;
    bar.style.width = "0%";
    
    gsap.to(bar, {
        width: targetWidth,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
            trigger: bar,
            start: "top 85%", 
        }
    });
});


// ================================================================
// 6. Hobi Projeleri Dikey Sekmesi
// Sadece .projects-section görünürken sağdan gelir; bölüm bitince gider.
// ================================================================
const hobbyCard = document.querySelector('.hobby-floating-card');

if (hobbyCard) {
    gsap.set(hobbyCard, { autoAlpha: 0, x: 90 });

    const showHobbyCard = () => {
        gsap.to(hobbyCard, {
            autoAlpha: 1,
            x: 0,
            duration: 0.45,
            ease: 'power3.out',
            overwrite: true,
            onStart: () => { hobbyCard.style.pointerEvents = 'auto'; }
        });
    };

    const hideHobbyCard = () => {
        gsap.to(hobbyCard, {
            autoAlpha: 0,
            x: 90,
            duration: 0.3,
            ease: 'power2.in',
            overwrite: true,
            onComplete: () => { hobbyCard.style.pointerEvents = 'none'; }
        });
    };

    ScrollTrigger.create({
        trigger: '.projects-section',
        start: 'top 70%',
        end: 'bottom 30%',
        onEnter: showHobbyCard,
        onLeave: hideHobbyCard,
        onEnterBack: showHobbyCard,
        onLeaveBack: hideHobbyCard
    });
}


// ================================================================
// 7. Projelerim Kısmı Eski Televizyon / Kare Kare Yüklenme Efekti
// ================================================================
const projectContainers = document.querySelectorAll('.project-image-container');

projectContainers.forEach(container => {
    const mask = document.createElement('div');
    mask.classList.add('pixel-mask');
    container.appendChild(mask);

    for(let i = 0; i < 30; i++) {
        const block = document.createElement('div');
        block.classList.add('pixel-block');
        mask.appendChild(block);
    }

    gsap.to(mask.children, {
        opacity: 0, 
        duration: 0.4,
        stagger: {
            amount: 0.8, 
            from: "random" 
        },
        scrollTrigger: {
            trigger: container,
            start: "top 85%", 
            toggleActions: "play none none none"
        }
    });
});


// ================================================================
// 8. Navbar Aktif Sekme Takipçisi (Scroll Spy)
// ================================================================
const sections = document.querySelectorAll("main[id], section[id]");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 250) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
});


// ================================================================
// 9. Ana Ekran (Hero) Çıkışı ve Video Lensi Girişi (Kusursuz Geçiş)
// ================================================================

// 1. Yazı ve Fotoğrafın (Hero) senkronize bir şekilde silinerek yukarı kayması
gsap.to(".hero-content", {
    y: -150,       
    opacity: 0,    
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",  
        end: "bottom top", 
        scrub: true        
    }
});

// 2. Siyahlık olmaması için video ekrana girdiği ilk an (top 100%) aydınlanmaya başlar
gsap.fromTo(".pinned-video-container", 
    { 
        scale: 1.3,          
        opacity: 0,          
        filter: "blur(20px)" 
    }, 
    {
        scale: 1,            
        opacity: 1,          
        filter: "blur(0px)", 
        ease: "none", // Scrub (tekerlek) ile en iyi uyumu none sağlar
        scrollTrigger: {
            trigger: ".video-pin-section",
            start: "top 100%", // Video bölümü alttan kendini gösterdiği an başlar
            end: "top 15%",    // Ekranın üstüne yaklaştığında odaklanma biter
            scrub: true       
        }
    }
);

// ================================================================
// FOOTER FOTOĞRAFI İÇİN ESKİ TELEVİZYON / PİKSEL AÇILMA EFEKTİ
// ================================================================

const footerImageContainer = document.querySelector('#footer-image-wrapper');

if (footerImageContainer) {
    // 1. Maske ve Blokları HTML içine enjekte et
    const mask = document.createElement('div');
    mask.classList.add('pixel-mask');
    footerImageContainer.appendChild(mask);

    // Kaç tane blok olacağını belirle (10x10 = 100 blok)
    const numBlocks = 100; 
    for(let i = 0; i < numBlocks; i++) {
        const block = document.createElement('div');
        block.classList.add('pixel-block');
        mask.appendChild(block);
    }

    // 2. GSAP ScrollTrigger Animasyonunu Ayarla
    gsap.to(mask.children, {
        opacity: 0, // Görünmez olacaklar
        duration: 0.6, // Her bir bloğun kaybolma süresi
        stagger: {
            amount: 0.8, // Toplam animasyon süresi
            from: "random", // Rastgele sırayla kaybolacaklar
            
        },
        scrollTrigger: {
            trigger: footerImageContainer, // Bu container ekrana girince tetiklenir
            start: "top 85%", // Ekranın %85'ine gelince başlar
            //toggleActions: "play none none none" // Bir kere oynatır (aşağı inince tekrar tetiklemez)
            
            // Eğer inip çıkınca tekrar pixel pixel olmasını istiyorsan:
             toggleActions: "play none none reverse"
        }
    });
}



// 1. Yazı Küçülme Efekti
gsap.to(".contact-title", {
    fontSize: "3rem", // Aşağı inince 3rem'e düşer
    scrollTrigger: {
        trigger: ".contact-section",
        start: "top bottom",
        end: "top top",
        scrub: true
    }
});

// Mail Kopyalama ve Animasyon Fonksiyonu
function copyEmail() {
    const email = "eyllsrsln@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const badge = document.getElementById("copyText");
        
        // Yazıyı ve rengi değiştir
        badge.innerText = "Kopyalandı! ✓";
        badge.style.background = "#4ade80"; // Soft bir yeşil
        badge.style.color = "#000";

        // 2 saniye sonra eski haline döndür
        setTimeout(() => {
            badge.innerText = "Kopyala";
            badge.style.background = "#fff";
        }, 2000);
    });
}

// Telif yılını cihazın güncel tarihine göre otomatik yenile.
const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = new Date().getFullYear();
