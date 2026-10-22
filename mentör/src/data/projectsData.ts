import { TubitakProject, TeknofestProject } from '../types';

export const INITIAL_TUBITAK_PROJECTS: TubitakProject[] = [
  {
    id: 'tubitak-101',
    projeAnaAlani: 'Bilgisayar ve Yazılım',
    projeTematikAlani: 'Yapay Zeka ve Veri Analitiği',
    projeAdi: 'Lise Öğrencilerinin Sınav Kaygısının Derin Öğrenme ve Fotopletismografi İle Tespiti ve Mobil Destek Modeli',
    ozet: 'Bu çalışmada, YKS sınavına hazırlanan 12. sınıf öğrencilerinin sınav anı ve deneme süreçlerindeki akut stres seviyelerini ölçmek amacıyla derin öğrenme tabanlı bir duygu ve biyometrik analiz modeli geliştirilmiştir. Çalışmada akıllı saat sensörlerinden alınan fotopletismografi (PPG) verileri ile ön kamera görüntülerinden elde edilen mikro mimik değişimleri eş zamanlı işlenmiştir. Elde edilen veriler konvolüsyonel sinir ağları (CNN) ile sınıflandırılmış ve kaygı anı saptandığında kullanıcıya anlık biyo-geribildirimli solunum egzersizi sunulmuştur. Yapılan saha testlerinde modelin kaygı tespit doğruluğu %91.4 olarak ölçülmüştür.',
    anahtarKelimeler: ['Sınav Kaygısı', 'Derin Öğrenme', 'Biyometrik Analiz', 'Fotopletismografi', 'Mobil Destek'],
    amac: 'Bu projenin temel amacı, lise öğrencilerinde akademik performansı olumsuz etkileyen sınav kaygısını invaziv olmayan biyometrik yöntemler ve yapay zeka algoritmalarıyla anlık olarak tespit etmek; elde edilen veriler ışığında öğrenciye otonom nefes ve odaklanma desteği sağlayan özgün bir Ar-Ge modeli geliştirmektir.',
    giris: 'Sınav kaygısı, öğrencilerin bilişsel süreçlerini ve bellek performansını kısıtlayan psikofizyolojik bir durumdur (Spielberger, 2010). Alan yazındaki mevcut çalışmalar genellikle öz-bildirim ölçeklerine dayanmakta olup, anlık fizyolojik değişimleri ölçecek objektif araçlardan yoksundur. Biyosensör teknolojilerindeki gelişmeler ve yapay zekanın veri işleme kabiliyeti, bu alan için yenilikçi olanaklar sunmaktadır.',
    yontem: 'Araştırmada nicel deneysel yöntem kullanılmıştır. 50 gönüllü 12. sınıf öğrencisinden deneme sınavı esnasında akıllı saat PPG sensör verileri ve mikro mimik görüntüleri toplanmıştır. Python ve PyTorch kütüphaneleri kullanılarak CNN tabanlı bir model eğitilmiştir. Model doğrulaması k-katlı çapraz doğrulama yöntemiyle gerçekleştirilmiştir.',
    isZamanCizelgesi: [
      { isAdi: 'Literatür Taraması ve Etik Kurul İzinleri', nisan: true, mayis: true, haziran: false, temmuz: false, agustos: false, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Veri Toplama Düzeneklerinin Kurulması', nisan: false, mayis: true, haziran: true, temmuz: false, agustos: false, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Derin Öğrenme Modelinin Eğitilmesi', nisan: false, mayis: false, haziran: true, temmuz: true, agustos: true, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Mobil Uygulama Entegrasyonu ve Pilot Testler', nisan: false, mayis: false, haziran: false, temmuz: false, agustos: true, eylul: true, ekim: true, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Raporlama ve Sonuçların İstatistiksel Analizi', nisan: false, mayis: false, haziran: false, temmuz: false, agustos: false, eylul: false, ekim: true, kasim: true, aralik: true, ocak: true },
    ],
    bulgular: 'Elde edilen bulgulara göre, kaygı anında kalp hızı değişkenliği (HRV) değerlerinde belirgin bir düşüş gözlemlenmiştir. CNN modelimiz %91.4 doğruluk, %89.2 hassasiyet oranı ile kaygı durumunu doğru sınıflandırmıştır. Biyo-geribildirim egzersizlerini uygulayan grupta odaklanma süresi ortalama %23 artmıştır.',
    sonucVeTartisma: 'Araştırma sonuçları, biyometrik veriler ile yapay zekanın entegrasyonunun sınav kaygısı yönetiminde etkili bir araç olabileceğini göstermiştir. Literatürdeki benzer çalışmalarla kıyaslandığında mobil cihaz uyumluluğu ve anlık müdahale mekanizması ile özgün bir değer sunmaktadır.',
    oneriler: 'Gelecek çalışmalarda sensör yelpazesinin galvanik deri yanıtı (GSR) ile genişletilmesi ve modelin farklı yaş gruplarında test edilmesi önerilmektedir.',
    kaynaklar: 'Spielberger, C. D. (2010). Anxiety and Behavior. Academic Press.\nGoodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press.\nTurk, M., & Pentland, A. (1991). Eigenfaces for recognition. Journal of Cognitive Neuroscience, 3(1), 71-86.',
    studentName: 'Caner Yıldız & Elif Şahin',
    createdAt: '22.07.2026',
  }
];

export const INITIAL_TEKNOFEST_PROJECTS: TeknofestProject[] = [
  {
    id: 'teknofest-201',
    kategori: 'İnsanlık Yararına Teknoloji',
    projeAdi: 'Afet Alanlarında Göçük Altı Canlı Tespiti Yapan Otonom Termal ve Akustik Drone Arama Sistemi',
    ozet: 'Bu proje, deprem ve benzeri doğal afetlerde arama-kurtarma ekiplerinin riskli enkaz alanlarına girmeden önce göçük altındaki canlıların konumunu anlık olarak tespit etmesini sağlayan yerli otonom insansız hava aracı (İHA) sistemidir. İHA üzerinde yüksek çözünürlüklü termal kamera, mikrofon dizilimi (akustik sensör) ve yerli yapay zeka kartı barındırmaktadır. Geliştirilen derin öğrenme algoritması, ortam gürültüsünü filtreleyerek insan sesi ve insan vücut sıcaklığı izlerini ayırt etmekte ve kurtarma ekiplerine harita üzerinde coğrafi koordinat aktarmaktadır.',
    anahtarKelimeler: ['Arama Kurtarma', 'Otonom İHA', 'Termal Görüntüleme', 'Gürültü Filtreleme', 'Afet Teknolojileri'],
    problemIhtiyac: 'Deprem sonrası altın saatler olarak adlandırılan ilk 72 saatte enkaz altında kalan vatandaşlarımıza ulaşmak kritik önem taşımaktadır. Mevcut arama yöntemleri insan gücüne dayalı olup yavaş ilerlemekte ve ikincil çökme riski taşımaktadır. Bu proje, hızlı, güvenli ve insan hayatını riske atmayan otonom tespit ihtiyacından doğmuştur.',
    yerlilikOzgunluk: 'Projede kullanılan otonom uçuş kontrol yazılımı ve akustik gürültü engelleme algoritmaları tamamen yerli olarak açık kaynak mimaride geliştirilmiştir. Piyasadaki ithal muadillerine kıyasla %65 daha düşük maliyetli olup Türkçe ses komutlarına duyarlı geliştirilmiştir.',
    hedefKitle: 'AFAD, Kızılay, İtfaiye Daire Başkanlıkları, Yerel Arama Kurtarma Dernekleri ve Askeri Arama Kurtarma Birlikleri.',
    yontemUygulanabilirlik: 'Donanım kısmında Pixhawk uçuş kontrol kartı, Raspberry Pi 5 yapay zeka işlemcisi, FLIR Lepton termal kamera ve 4’lü mikrofon dizilimi entegre edilmiştir. Yazılım tarafında ROS (Robot Operating System) ve TensorFlow Lite kütüphaneleri kullanılmıştır.',
    yerliUretimVeRiskler: 'Gövde parçaları yerli 3D yazıcı karbon-fiber filamanlar ile üretilecektir. Risk olarak sert hava koşulları belirlenmiş olup, rüzgar direnci için fırçasız motor gücü yükseltilmiştir.',
    etkiVeSurdurulebilirlik: 'Arama-kurtarma süresini ortalama %40 kısaltması öngörülmektedir. Seri üretime geçildiğinde tüm belediye ve arama ekiplerine yaygınlaştırılabilir niteliktedir.',
    isZamanCizelgesi: [
      { isAdi: 'Sistem Mimarisi ve Komponent Temini', nisan: true, mayis: false, haziran: false, temmuz: false, agustos: false, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'İHA Gövde Tasarımı ve 3D Baskı', nisan: false, mayis: true, haziran: true, temmuz: false, agustos: false, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Akustik ve Termal Yapay Zeka Algoritması', nisan: false, mayis: false, haziran: true, temmuz: true, agustos: true, eylul: false, ekim: false, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Saha Testleri ve AFAD Parkur Denemeleri', nisan: false, mayis: false, haziran: false, temmuz: false, agustos: true, eylul: true, ekim: true, kasim: false, aralik: false, ocak: false },
      { isAdi: 'Detay Raporu ve Sunum Hazırlığı', nisan: false, mayis: false, haziran: false, temmuz: false, agustos: false, eylul: false, ekim: true, kasim: true, aralik: true, ocak: true },
    ],
    kaynaklar: 'AFAD Deprem Müdahale Raporu (2023).\nCorke, P. (2017). Robotics, Vision and Control. Springer.\nRedmon, J., & Farhadi, A. (2018). YOLOv3: An Incremental Improvement. arXiv preprint arXiv:1804.02767.',
    studentName: 'Mert Aksoy & Derya Yılmaz',
    createdAt: '22.07.2026',
  }
];
