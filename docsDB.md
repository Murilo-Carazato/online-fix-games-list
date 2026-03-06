// ─── 1. TABELA PRINCIPAL DO JOGO (games) ──────────────────────────────────
// Aqui ficam apenas os dados escalares intrínsecos e únicos à identidade do jogo.
games[0].id = 1 // Surrogate ID (Chave Primária Numérica)
games[0].title = "REANIMAL"
games[0].fileSizeValue = 12.4
games[0].fileSizeUnit = "GB"
games[0].uploadDate = "2026-03-02T16:46:14.000Z"
games[0].isEnriched = true
games[0].igdbId = 314265
games[0].rawgId = 988099
games[0].totalRating = 4.2
games[0].totalRatingCount = 25
games[0].addedTotal = 160
games[0].playtime = 5
games[0].coverUrl = "//images.igdb.com/igdb/image/upload/t_cover_big/coaveu.jpg"
// O updatedAt é gerado de forma invisível pelo banco de dados no momento do insert.

// ─── 2. LOOKUPS SIMPLES (genres, themes, gameModes) ───────────────────────
// Primeiro, as categorias puras são inseridas (ou apenas selecionadas caso já existam):
genres[0] = { id: 1, name: "Puzzle" }
genres[1] = { id: 2, name: "Adventure" }

themes[0] = { id: 1, name: "Action" }
themes[1] = { id: 2, name: "Horror" }

gameModes[0] = { id: 1, name: "Single player" }
gameModes[1] = { id: 2, name: "Multiplayer" }
gameModes[2] = { id: 3, name: "Co-operative" }

// Depois, linkamos cada categoria ao gameId na respectiva tabela N:M (junction table):
gameGenres[0] = { gameId: 1, genreId: 1 } // REANIMAL -> Puzzle
gameGenres[1] = { gameId: 1, genreId: 2 } // REANIMAL -> Adventure

gameThemes[0] = { gameId: 1, themeId: 1 } // REANIMAL -> Action
gameThemes[1] = { gameId: 1, themeId: 2 } // REANIMAL -> Horror

gameGameModes[0] = { gameId: 1, gameModeId: 1 } // REANIMAL -> Single player
gameGameModes[1] = { gameId: 1, gameModeId: 2 } // REANIMAL -> Multiplayer
gameGameModes[2] = { gameId: 1, gameModeId: 3 } // REANIMAL -> Co-operative

// ─── 3. TABELAS HIERÁRQUICAS 1:N (Platforms) ──────────────────────────────
// O banco separa "Marcas" de "Versões":
platforms[0] = { id: 1, name: "Xbox" }
platforms[1] = { id: 2, name: "PlayStation" }

platformVersions[0] = { id: 1, platformId: 1, name: "Series X|S" }
platformVersions[1] = { id: 2, platformId: 2, name: "5" }

// Ligamos ao jogo APENAS através do ID da VERSÃO, pois a versão já diz quem é a mãe dela:
gamePlatformVersions[0] = { gameId: 1, platformVersionId: 1 }
gamePlatformVersions[1] = { gameId: 1, platformVersionId: 2 }

// ─── 4. HIERARQUIA AGREGADA MULTINÍVEL (Idiomas) ──────────────────────────
// Isola os idiomas puros:
languages[0] = { id: 1, name: "English" }
languages[1] = { id: 2, name: "Portuguese (Brazil)" }

// Isola os tipos primitivos de tradução:
languageSupportTypes[0] = { id: 1, name: "Audio" }
languageSupportTypes[1] = { id: 2, name: "Subtitles" }
languageSupportTypes[2] = { id: 3, name: "Interface" }

// Cria um "nó" dizendo "O Reanimal tem o idioma Inglês":
gameLanguages[0] = { id: 1, gameId: 1, languageId: 1 } // REANIMAL -> Inglês
gameLanguages[1] = { id: 2, gameId: 1, languageId: 2 } // REANIMAL -> PT-BR

// Agora desce pro detalhe (O "Inglês do Reanimal" engloba que tipos?):
gameLanguageSupports[0] = { gameLanguageId: 1, supportTypeId: 1 } // (Inglês do Reanimal) tem Audio
gameLanguageSupports[1] = { gameLanguageId: 1, supportTypeId: 2 } // (Inglês do Reanimal) tem Subtitles
gameLanguageSupports[2] = { gameLanguageId: 1, supportTypeId: 3 } // (Inglês do Reanimal) tem Interface
gameLanguageSupports[3] = { gameLanguageId: 2, supportTypeId: 1 } // (PT-BR do Reanimal) tem Audio
// etc...

// ─── 5. HERANÇA DE TABELAS (Videos: Class Table Inheritance) ─────────────
// No Postgres, salvamos urls brutas na tabela MÃE:
videos[0] = { id: 1, gameId: 1, url: "https://www.youtube.com/watch?v=ai6lH55Dn8I" }
videos[1] = { id: 2, gameId: 1, url: "https://www.youtube.com/watch?v=4BnNXI0Uy04" }
videos[2] = { id: 3, gameId: 1, url: "https://www.youtube.com/watch?v=uS_4RJnEXHc" }

// As tabelas filhas (igdb_videos e alanzoka_videos) só estendem a base herdando a URL dela, usando FKs como PKs:
igdbVideos[0] = { videoId: 1 } 
igdbVideos[1] = { videoId: 2 }

alanzokaVideos[0] = { 
    videoId: 3, 
    title: "BIZARRO DEMAIS! - REANIMAL COM O FALL", 
    publishedAt: "2026-02-14T15:02:52Z", 
    thumbnailUrl: "https://i.ytimg.com/vi/uS_4RJnEXHc/hqdefault.jpg",
    channelTitle: "alanzoka" 
}

// ─── 6. DICIONÁRIOS ESTATÍSTICOS (Ratings e Added By Stats) ──────────────────
// Quebramos a lista longa JSON em identidades:
ratingCategories[0] = { id: 1, title: "recommended", score: 4 }
ratingCategories[1] = { id: 2, title: "exceptional", score: 5 }
ratingCategories[2] = { id: 3, title: "meh", score: 3 }

gameRatings[0] = { gameId: 1, ratingCategoryId: 1, count: 17, percent: 68 }
gameRatings[1] = { gameId: 1, ratingCategoryId: 2, count: 7, percent: 28 }
gameRatings[2] = { gameId: 1, ratingCategoryId: 3, count: 1, percent: 4 }

// Added stat desmembrado do "addedByStatus" - 1:1, então atributos deitam retos:
gameAddedStats[0] = { gameId: 1, yet: 26, owned: 19, beaten: 36, toplay: 63, dropped: 3, playing: 13 }

// ─── 7. ARRAYS SIMPLES, NULOS E LINKS ESTENDIDOS ──────────────────────────────
// Franquias: Como o JSON enviou "franchises": [], nada é iterado ou salvo, portanto gameFranchises passará em branco para este jogo.

// Screenshots:
screenshots[0] = { id: 1, gameId: 1, url: "https://media.rawg.io/...668.jpg" }
screenshots[1] = { id: 2, gameId: 1, url: "https://media.rawg.io/...dad5.jpg" }

// External Links - Lojas cadastradas estaticamente:
stores[0] = { 
    id: 1, 
    name: "Steam", 
    domainPattern: "store.steampowered.com", 
    iconUrl: "https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=128" 
}
stores[1] = { 
    id: 2, 
    name: "PlayStation", 
    domainPattern: "store.playstation.com", 
    iconUrl: "https://www.google.com/s2/favicons?domain=store.playstation.com&sz=128" 
}

// Relacionamentos reais do jogo na tabela de junção externa:
gameExternalLinks[0] = { 
    id: 1, 
    gameId: 1, 
    storeId: 2, // Aponta p/ PlayStation Store Genérica
    platformStoreId: null, // Veio nulo pois não sabemos ainda se atrela ao PS4 ou PS5 no metadado bruto
    url: "https://store.playstation.com/en-us/concept/10010999" 
}
gameExternalLinks[1] = { 
    id: 2, 
    gameId: 1, 
    storeId: 1, // Aponta p/ Steam Genérica
    platformStoreId: null, 
    url: "https://store.steampowered.com/app/2129530" 
}
