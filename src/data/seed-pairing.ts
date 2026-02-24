import type { PairingDataset } from "@/types/pairing";

export const seedPairingDataset: PairingDataset = {
  dishes: [
    {
      id: "escargots",
      name: "Escargots de Bourgogne",
      price: 18,
      description:
        "Burgundy snails with garlic herb butter, parsley and toasted baguette points.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0",
      tags: ["Starter", "Classic", "Garlic"],
    },
    {
      id: "duck-confit",
      name: "Duck Confit",
      price: 34,
      description:
        "Slow-cooked duck leg with crispy skin, sarladaise potatoes and thyme jus.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ",
      tags: ["Main", "Rich", "Savory"],
    },
    {
      id: "beef-tartare",
      name: "Beef Tartare",
      price: 22,
      description:
        "Hand-cut beef fillet, capers, shallots, egg yolk and house spice blend.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c",
      tags: ["Starter", "Raw", "Peppery"],
    },
    {
      id: "scallops",
      name: "Seared Scallops",
      price: 28,
      description: "Jumbo scallops, cauliflower puree, truffle oil and micro greens.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A",
      tags: ["Main", "Seafood", "Delicate"],
    },
  ],
  wines: [
    {
      id: "riesling",
      name: "Trimbach Riesling",
      region: "Alsace, France",
      year: 2020,
      price: 76,
      rating: 4.8,
      description: "Bone-dry profile with mineral finish and focused citrus backbone.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuABMH3ZAPvQDWYLpx-j0KtibgdkAUtyn9irKC3oXRspQSs0L9BsBfegaa05g4i_0tSTAW2oZUOVeLU0TtyFc1K6gp9TfjjgZ7Lh0uRB-UYI67OyHB5bXgnk2CgEXCNZJm2Su_74shDXO5hQdBWcAooOCdq4ysIJzg54UF46RvRo01GL2ZqihghrKbGQqaoITAMvMzcLiiJaVn6TBq2OkAquPEoUQVI81Wgbb-9V35UAkU0E365Iug6VT10azf1carabk54uYi1aZ9Q",
      tags: ["Dry", "High Acid"],
      passport: {
        grape: "Riesling",
        abv: 13,
        body: "light",
        acidity: "high",
        tannin: "none",
        servingTempC: "8-10",
        decant: "No decant. Open 10 minutes before service.",
      },
    },
    {
      id: "pinot",
      name: "Cristom Mt. Jefferson Cuvee Pinot Noir",
      region: "Willamette Valley, USA",
      year: 2021,
      price: 98,
      rating: 4.4,
      description: "Red cherry fruit, bright acidity and earthy undertones.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDE5USocOgYDhITeOQgMjG7LsiFuP3dqCZ6ueQfcYZ8fhmANSDP1Ms-UZ9B9oJVJPYSOaZ3VpdtN3zyNF8TlHglSTJVg9gHSm_0tFfHPX5s97iOrE5dkxl8WQVXA0nFYyNZWuN2uKMWMhyYj5Bo2XsLZP1kAg3uWQqsMZZWtxGUHxxvebDE7WZyPDwuWr3r-VBADpbh-N9Sqxz6jI6vK_L0e7aPNXfeLMb5unfSqT2DCc9df0kvGi7FH92cvQDILKSbktOz8E-Xxjk",
      tags: ["Light Body", "Earthy"],
      passport: {
        grape: "Pinot Noir",
        abv: 13.5,
        body: "medium",
        acidity: "high",
        tannin: "soft",
        servingTempC: "14-16",
        decant: "Optional 20-minute decant for aromatic lift.",
      },
    },
    {
      id: "cabernet",
      name: "Stag's Leap Wine Cellars Artemis Cabernet Sauvignon",
      region: "Napa Valley, USA",
      year: 2020,
      price: 168,
      rating: 4.5,
      description: "Powerful tannins and dark fruit built for heavier proteins.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC0K331aFTTh8xf47OiTmQkjzYyZgsVD8dtLxHbYmrVTeRYnzM9_sxSUJNLifZ7_opq23tVHQwU759mDWEjQC09iYiQIw7WnQmDCo82059t1Elow-QvBZreisUpw7R37nPZGSPem6SAgjbQsp7J8EKLHZVJyIOg2Fa2GO67LBWEF1MdpmF3llAdkLBrQy2Wz24RK7T5Z7Jo7BthcvqGi_Gzm_KZROTfmpEl17VY34aF6paOjoGOelftLHRxt0AGBc4zkKmYCt2tB7Y",
      tags: ["Bold", "Tannic"],
      passport: {
        grape: "Cabernet Sauvignon",
        abv: 14.6,
        body: "full",
        acidity: "medium",
        tannin: "high",
        servingTempC: "16-18",
        decant: "Decant 45-60 minutes before service.",
      },
    },
    {
      id: "rose",
      name: "Chateau d'Esclans Whispering Angel Rose",
      region: "Provence, France",
      year: 2023,
      price: 64,
      rating: 4.1,
      description: "Crisp and floral with a light body and summer-fruit profile.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTbxB_RLGGuNNlEY6_aWuM1r77Q-7NQwx10_8Y_xN-XYN6hS0sMOpNmzpTvTNYMpWx4NIGkf-fEv4DIhN8O8y5hsTrWAplmhMkwsEOFhpMyfLP5c5w5pID7cRlk8quUWEF70XRhU38CCLnXTghZt1pykh4bkZK0OKa3EG56NHBS3LDlOy0CXoZCORtSZZe2mSMjK7GvAntDHQWy8RVWuqVtaSUUsluhysKaKk7N_OPwl-iURyfGpR3lun0WfF_nkagtyvx7PU2kQs",
      tags: ["Crisp", "Fruity"],
      passport: {
        grape: "Grenache Blend",
        abv: 13,
        body: "light",
        acidity: "medium",
        tannin: "none",
        servingTempC: "8-10",
        decant: "No decant. Serve chilled.",
      },
    },
    {
      id: "champagne",
      name: "Louis Roederer Collection 244",
      region: "Champagne, France",
      year: 2021,
      price: 122,
      rating: 4.6,
      description: "Fine mousse, citrus peel, toasted brioche and chalky finish.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTbxB_RLGGuNNlEY6_aWuM1r77Q-7NQwx10_8Y_xN-XYN6hS0sMOpNmzpTvTNYMpWx4NIGkf-fEv4DIhN8O8y5hsTrWAplmhMkwsEOFhpMyfLP5c5w5pID7cRlk8quUWEF70XRhU38CCLnXTghZt1pykh4bkZK0OKa3EG56NHBS3LDlOy0CXoZCORtSZZe2mSMjK7GvAntDHQWy8RVWuqVtaSUUsluhysKaKk7N_OPwl-iURyfGpR3lun0WfF_nkagtyvx7PU2kQs",
      tags: ["Sparkling", "Mineral"],
      passport: {
        grape: "Chardonnay, Pinot Noir, Meunier",
        abv: 12.5,
        body: "medium",
        acidity: "high",
        tannin: "none",
        servingTempC: "7-9",
        decant: "No decant. Serve chilled in white-wine stem.",
      },
    },
  ],
};
