$(document).ready(function(){
    let currentIndex = 0;
    const images = $('.rotating-images img');
    const totalImages = images.length;

    setInterval(function(){
        images.eq(currentIndex).removeClass('active');
        currentIndex = (currentIndex + 1) % totalImages;
        images.eq(currentIndex).addClass('active');
    }, 4000);
});
