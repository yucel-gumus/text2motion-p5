/**
 * Application constants and configuration values
 */

/** UI Layout constants */
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 500,
  TOOLBAR_HEIGHT: 80,
  INPUT_AREA_HEIGHT: 80,
  CHAT_GAP: 1.25,
  BORDER_RADIUS: {
    MESSAGE: 18,
    INPUT: 20,
    BUTTON: 100,
    CODE: 10,
  },
  ANIMATION_DURATION: 0.3,
} as const;

/** External URLs */
export const EXTERNAL_URLS = {
  P5JS_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/p5.min.js',
  P5JS_SOUND_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/addons/p5.sound.min.js',
  GOOGLE_FONTS: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap',
} as const;

/** AI Configuration */
export const AI_CONFIG = {
  MODEL: 'gemini-2.0-flash',
  API_VERSION: 'v1alpha',
  SYSTEM_INSTRUCTIONS: `Sen yaratıcı kodlama konusunda son derece yetenekli bir yardımcısın ve efektler, oyunlar, generatif sanat, ses görselleştirme kodlayabilirsin.
javascript kodu yaz ve bunun canlı p5js ortamında olduğunu varsay.
hem p5.js hem de p5.sound kütüphaneleri mevcut - FFT, ses analizi, mikrofon girişi gibi ses işleme fonksiyonlarını kullanabilirsin.

ÖNEMLİ SES KULLANIM KURALLARI:
- p5.Synth yerine p5.Oscillator kullan: let osc = new p5.Oscillator('sine');
- Ses için: p5.SoundFile, p5.AudioIn, p5.FFT, p5.Amplitude, p5.Filter kullan
- Oscillatör başlatma: osc.start(); osc.stop();
- Frekans ayarlama: osc.freq(440);
- Ses dosyası: let sound = loadSound('url'); sound.play();
- p5.Synth constructor hatası veren p5.Synth kullanma!

kod bloğunu döndür.
mantığını ve sonucu anlaşılır şekilde açıklayan kısa bir paragraf ekleyebilirsin.
harici bağımlılık olamaz: tüm fonksiyonlar kod içinde tanımlanmalı veya p5js/p5.sound'un parçası olmalı.
tüm fonksiyonların ya kodda tanımlandığından ya da p5js/p5.sound'un parçası olduğundan emin ol.
kullanıcı kodu değiştirebilir, kullanıcının değişikliklerine uyum sağla.`,
} as const;

/** Default code templates */
export const CODE_TEMPLATES = {
  EMPTY: `function setup() {
  // Kurulum kodu buraya gelir.
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  // Çizim kodu buraya gelir.
  background(175);
}`,
  
  STARTUP: `function setup() {
  createCanvas(windowWidth, windowHeight);
  // Renk modunu HSB (Ton, Doygunluk, Parlaklık) olarak ayarla
  // Ton 0-360, Doygunluk ve Parlaklık 0-100 arasında
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  // Zamana göre değişen bir ton değeri hesapla
  // frameCount kullan, bu her kare ile artar
  // Renk değişimini yavaşlatmak için küçük bir sayı ile çarp
  // Ton değerini 360 etrafında döndürmek için modulo (%) operatörü kullan
  let hue = (frameCount * 0.5) % 360;

  // Hesaplanan tonu kullanarak arka plan rengini ayarla
  // Canlı renkler için doygunluk ve parlaklığı yüksek tut
  background(hue, 90, 90);
}

// İsteğe bağlı: Tarayıcı penceresi boyutu değişirse tuali yeniden boyutlandır
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}`,
} as const;

/** Example prompts for user inspiration */
export const EXAMPLE_PROMPTS = [
  'ekrana rastgele konumlarda beliren daireler çiz',
  'fareye doğru hareket eden bir top yap',
  'ekrana tıkladıkça farklı renklerde yıldızlar çiz',
  'yavaşça büyüyüp küçülen bir daire animasyonu yap',
  'sürekli sağa doğru hareket eden basit bir kare animasyonu yap',
] as const;

/** Timing constants */
export const TIMING = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  SCROLL_DELAY: 100,
} as const;

/** Error messages */
export const ERROR_MESSAGES = {
  GENAI_ERROR: 'Yapay Zeka Hatası:',
  PARSE_ERROR: 'Hata mesajı ayrıştırılamadı:',
  NO_CODE_UPDATE: 'Yeni kod güncellemesi yok.',
  SKETCH_ERROR: 'Kod hatası:',
  API_KEY_MISSING: 'GEMINI_API_KEY yapılandırılmamış',
  CONNECTION_ERROR: 'Bağlantı hatası oluştu',
} as const;

/** Turkish UI Text */
export const UI_TEXT = {
  // Tab names
  CHAT_TAB: 'Sohbet',
  CODE_TAB: 'Kod',
  
  // Button labels
  SEND: 'Gönder',
  RELOAD: 'Yenile',
  PLAY: 'Oynat',
  STOP: 'Durdur',
  RESET: 'Sıfırla',
  IMPROVE: 'İyileştir',
  
  // Status messages
  GENERATING: 'Üretiliyor...',
  THINKING: 'Düşünüyor...',
  CODING: 'Kodluyor...',
  DONE: 'Tamamlandı',
  
  // Placeholders
  MESSAGE_PLACEHOLDER: 'Mesajınızı yazın... (örn: "renkli bir animasyon yap")',
  
  // Tooltips
  RELOAD_TOOLTIP: 'Kod değişikliklerini yenile',
  PLAY_TOOLTIP: 'Kodu çalıştır',
  STOP_TOOLTIP: 'Çalışmayı durdur',
  RESET_TOOLTIP: 'Playground\'u sıfırla',
  
  // Welcome messages
  WELCOME_USER_MESSAGE: 'arka plan renginin basit bir animasyonunu yap',
  WELCOME_ASSISTANT_MESSAGE: 'İşte kod! 🎨',
  STARTUP_PROMPT_PREFIX: 'Sıfırdan başla ve ',
  
  // Thinking section
  THINKING_LABEL: 'Düşünüyor...',
  
  // Error messages
  ROOT_ELEMENT_ERROR: 'Kök element bulunamadı',
  
  // Code execution
  SKETCH_STOPPED: 'Kod durduruldu (noLoop)',
  SKETCH_RESUMED: 'Kod devam ediyor (loop)',
  CONSOLE_ERROR_PREFIX: 'Hata: ',
  CONSOLE_ERROR_SUFFIX: '\nDetaylar için tarayıcı konsolunu kontrol edin veya Gemini\'den düzeltmesini isteyin.',
} as const; 