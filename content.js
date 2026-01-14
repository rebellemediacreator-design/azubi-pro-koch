/* content.js */
window.AZUBI_CONTENT = {
  meta: {
    productTitle: "Azubi Tagebuch Küche",
    provider: "🖤RE:BELLE™ Media",
    tagline: "The Art of Feeling. Amplified.",
    websites: ["newwomanintheshop.com", "rebellemedia.de"],
    contact: "rebelle.media.creator@gmail.com",
    author: "Kevin Schlesier"
  },

  wissen: {
    years: {
      1: {
        title: "Lehrjahr 1: Grundlagen",
        intro:
          "Im 1. Lehrjahr geht es um Sicherheit, Hygiene, saubere Basics und Ordnung. Tempo kommt später. Wer hier sauber arbeitet, gewinnt den Service – und bleibt gesund.",
        modules: [
          {
            id: "y1_hygiene",
            title: "Hygiene & HACCP – verständlich, aber ernst",
            lead:
              "HACCP ist kein Papierkram, sondern eine Denkweise: Wo kann etwas gefährlich werden – und wie verhindere ich es, bevor es passiert?",
            sections: [
              {
                h: "Warum Hygiene in der Küche anders ist als zu Hause",
                p: [
                  "In der Profi-Küche verarbeitest du große Mengen, viele Produkte gleichzeitig und arbeitest unter Zeitdruck. Genau das ist der Nährboden für Fehler: roh/gar wird verwechselt, Flächen werden „kurz“ abgewischt, Kühlung wird „nur kurz“ geöffnet. HACCP bedeutet: Risiken erkennen und kontrollieren.",
                  "Merksatz: Hygiene ist nicht Sauberkeit. Hygiene ist Risikokontrolle."
                ]
              },
              {
                h: "Die 3 Haupt-Risiken (die fast immer zuschlagen)",
                ul: [
                  "Temperatur: Lebensmittel sind zu warm gelagert oder zu lange ungekühlt.",
                  "Kreuzkontamination: Keime/Allergene wandern von roh zu verzehrfertig.",
                  "Reinigung: Flächen/Tools sehen sauber aus, sind es aber nicht."
                ]
              },
              {
                h: "Kühlkette – die einfache Logik",
                p: [
                  "Kühlkette heißt: kalt bleibt kalt. Je länger Produkte im „Wärme-Bereich“ stehen, desto stärker vermehren sich Keime. Darum gilt: Ware schnell verräumen, Mise nicht ewig draußen lassen, Türen nicht offen stehen lassen.",
                  "Praxisregel: Nur das rausnehmen, was du in kurzer Zeit wirklich brauchst. Rest bleibt kalt."
                ]
              },
              {
                h: "Reinigen vs. Desinfizieren",
                ul: [
                  "Reinigen: Schmutz/Fett entfernen (sonst wirkt Desinfektion schlecht).",
                  "Desinfizieren: Keime reduzieren (nach Plan, nicht als Ersatz fürs Reinigen).",
                  "Wichtig: Das Küchenkonzept im Betrieb zählt (Reinigungsplan)."
                ]
              },
              {
                h: "Persönliche Hygiene (kurz, aber verbindlich)",
                ul: [
                  "Hände: vor Arbeitsbeginn, nach Toilette, nach Rohware, nach Müll, nach Handy – immer.",
                  "Wunden: sauber abdecken, ggf. Handschuh darüber (Handschuh ersetzt kein Händewaschen).",
                  "Schmuck/Nägel: Risiko für Keime + Verletzung + Fremdkörper im Essen."
                ]
              }
            ],
            callout: {
              title: "Typischer Anfängerfehler",
              text:
                "Ein Brett für „kurz mal“ Rohware und danach Salat. Lösung: Trennen. Wenn unsicher: neues Brett/Tool. Nicht diskutieren – machen."
            }
          },

          {
            id: "y1_safety",
            title: "Arbeitssicherheit – weil Unfälle teuer sind",
            lead:
              "Sicher arbeiten bedeutet: weniger Stress, weniger Verletzungen, bessere Qualität. Du bist nur gut, wenn du heil bleibst.",
            sections: [
              {
                h: "Messer: 3 Regeln, die immer gelten",
                ul: [
                  "Kralle: Fingerkuppen zurück, Knöchel führen das Messer.",
                  "Klinge arbeitet – du drückst nicht mit Gewalt.",
                  "Messer nie im Spülbecken verstecken (Unfall-Garantie)."
                ]
              },
              {
                h: "Hitze: Verbrennungen vermeiden",
                ul: [
                  "Heißes Fett: nie Wasser in Fett. Spritzgefahr – Deckel/Hitze reduzieren.",
                  "Dampf: Deckel von dir weg öffnen.",
                  "Backofen/Combisteamer: Handschuhe trocken, sonst leitet Feuchtigkeit Hitze."
                ]
              },
              {
                h: "Rutschgefahr & Ordnung",
                p: [
                  "Nasse Böden, offene Schubladen, Kabel, herumliegende Kisten – das sind keine Kleinigkeiten. Das ist Unfallmaterial.",
                  "Standard: Arbeitsplatz resetten: sauber, trocken, frei."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Schnell ist nur, wer sicher ist. Alles andere ist Chaos."
            }
          },

          {
            id: "y1_mise",
            title: "Mise en place & Ordnung – die Basis für Tempo",
            lead:
              "Mise en place ist Vorbereitung mit System. Es spart Zeit im Service, verhindert Fehler und macht Übergaben möglich.",
            sections: [
              {
                h: "Mise-Logik in 5 Schritten",
                ul: [
                  "Plan: Was wird heute gebraucht?",
                  "Vorbereiten: schneiden, abwiegen, vorkochen – sauber.",
                  "Beschriften: Inhalt + Datum + ggf. Allergene/Hinweise.",
                  "Lagern: richtig kalt/warm, richtig abgedeckt.",
                  "Nachservice: auffüllen/entsorgen, Übergabe notieren."
                ]
              },
              {
                h: "FIFO – zuerst rein, zuerst raus",
                p: [
                  "FIFO verhindert, dass Altes hinten vergisst wird und irgendwann „komisch riecht“. FIFO ist kein Büroprinzip. Es ist Lebensmittelsicherheit + Wareneinsatz.",
                  "Praxis: Neues immer nach hinten/unten, Altes nach vorne/oben."
                ]
              },
              {
                h: "Übergabe an die nächste Schicht",
                ul: [
                  "Was ist fertig? Was fehlt? Was ist kritisch (Temperatur, Haltbarkeit)?",
                  "Was muss zuerst gemacht werden?",
                  "Welche Probleme gab es (Engpass, Gerät, Ware)?"
                ]
              }
            ],
            callout: {
              title: "Typischer Anfängerfehler",
              text:
                "Alles gleichzeitig anfangen. Lösung: Reihenfolge definieren: erst das, was Zeit braucht oder kalt werden muss, dann Rest."
            }
          },

          {
            id: "y1_knife",
            title: "Messer & Schnitttechniken – gleichmäßig = gleich gar",
            lead:
              "Schnitt ist nicht Deko. Schnitt bestimmt Garzeit, Optik und Konsistenz. Ungleichmäßig heißt: ein Teil matschig, ein Teil roh.",
            sections: [
              {
                h: "Was „sauber schneiden“ bedeutet",
                ul: [
                  "Scharfes Messer (stumpf = gefährlicher).",
                  "Gerader Schnitt ohne Sägen (außer bei Brot/Schale).",
                  "Gleichmäßige Größe = gleichmäßige Garung."
                ]
              },
              {
                h: "Grundformen (für den Anfang reicht das)",
                ul: [
                  "Scheiben: gleich dick.",
                  "Stifte/Streifen: gleich breit.",
                  "Würfel: gleich groß.",
                  "Hack: fein, aber nicht „Matsch“."
                ]
              },
              {
                h: "Qualitätscheck in 10 Sekunden",
                ul: [
                  "Sieht die Größe gleich aus?",
                  "Sind die Kanten sauber oder ausgefranst?",
                  "Sind die Bretter sauber, nicht voll mit Resten?",
                  "Liegt alles geordnet (nicht überall verteilt)?"
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Du schneidest nicht für den Teller. Du schneidest für die Garung."
            }
          },

          {
            id: "y1_methods",
            title: "Grundgarverfahren – die Küche in 7 Verben",
            lead:
              "Du musst nicht 100 Rezepte können. Du musst verstehen, was Hitze mit Lebensmitteln macht – dann kannst du kochen.",
            sections: [
              {
                h: "Kochen",
                p: [
                  "Garen in Wasser/Flüssigkeit. Temperatur ist begrenzt (nahe Siedepunkt). Gut für Pasta, Kartoffeln, Gemüse (je nach Ziel).",
                  "Fehler: zu lang = matschig. Lösung: Zielkonsistenz kennen."
                ]
              },
              {
                h: "Blanchieren",
                p: [
                  "Kurz in kochendes Wasser, dann abschrecken. Zweck: Farbe/Struktur stabilisieren, Garung stoppen, Vorbereitung.",
                  "Fehler: nicht abschrecken → gart nach."
                ]
              },
              {
                h: "Dämpfen/Dünsten",
                p: [
                  "Schonender als kochen. Dämpfen: Wasserdampf. Dünsten: wenig Flüssigkeit, oft mit Deckel.",
                  "Fehler: Deckel oft auf → Energieverlust, ungleichmäßig."
                ]
              },
              {
                h: "Braten/Sautieren",
                p: [
                  "Trockenhitze, Oberfläche wird aromatisch (Röstaromen). Sautieren ist „schnell in der Pfanne“, oft mit wenig Fett.",
                  "Fehler: Pfanne zu voll → es kocht statt zu braten."
                ]
              },
              {
                h: "Schmoren",
                p: [
                  "Kombination: erst anbraten, dann in Flüssigkeit langsam garen. Ideal für zähere Stücke – wird zart.",
                  "Fehler: zu heiß → trocken, Flüssigkeit verdampft."
                ]
              },
              {
                h: "Frittieren",
                p: [
                  "Garen in heißem Fett. Temperatur muss stabil sein, sonst saugt das Produkt Fett.",
                  "Fehler: zu kalt → fettig. Zu heiß → außen dunkel, innen roh."
                ]
              }
            ],
            callout: {
              title: "Praxisregel",
              text:
                "Wenn etwas „nicht funktioniert“, prüfe zuerst: Temperatur, Zeit, Größe des Schnitts, Menge in der Pfanne. Meist liegt es daran."
            }
          },

          {
            id: "y1_taste",
            title: "Abschmecken & Sensorik – nicht raten, prüfen",
            lead:
              "Abschmecken ist ein Skill. Es ist nicht „noch Salz“. Es ist Balance: Salz, Säure, Süße, Umami, Bitterkeit, Schärfe.",
            sections: [
              {
                h: "Die Reihenfolge, die dich rettet",
                ul: [
                  "1) Salz: bringt Geschmack nach vorne.",
                  "2) Säure: macht es klar/frisch.",
                  "3) Süße: rundet ab, nimmt Schärfe/Bitternote.",
                  "4) Umami: Tiefe (z. B. Fonds, Tomate, Parmesan).",
                  "5) Schärfe: vorsichtig, sonst überdeckt alles."
                ]
              },
              {
                h: "Wenn’s zu salzig ist",
                ul: [
                  "Verdünnen: mehr Basis ohne Salz (Flüssigkeit/ungewürzte Komponente).",
                  "Ausbalancieren: vorsichtig Säure/Süße (nicht „zukleistern“).",
                  "Ehrlich sein: Manches ist nicht mehr zu retten – Standard schützen."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Abschmecken ist kontrolliertes Entscheiden – nicht blindes Nachwürzen."
            }
          },

          {
            id: "y1_allergens",
            title: "Allergene – Basics ohne Panik",
            lead:
              "Allergene sind kein Trend. Für Gäste kann es ernst sein. Deine Aufgabe: nicht raten, sondern sicher handeln.",
            sections: [
              {
                h: "Was du im 1. Lehrjahr sicher können musst",
                ul: [
                  "Ich weiß: Welche Komponenten sind drin – oder ich frage nach.",
                  "Ich trenne: allergenfrei/allergenhaltig in Tools und Flächen.",
                  "Ich kommuniziere: klar am Pass/Service, wenn es unsicher ist."
                ]
              },
              {
                h: "Kontamination einfach erklärt",
                p: [
                  "Kontamination heißt: winzige Spuren reichen bei manchen Allergien. Darum ist „nur kurz“ mit dem selben Löffel ein echtes Risiko.",
                  "Standard: neues Tool, saubere Fläche, klare Kennzeichnung."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Bei Allergenen gilt: lieber einmal zu viel neu ansetzen als einmal falsch rausgeben."
            }
          }
        ]
      },

      2: {
        title: "Lehrjahr 2: Tempo & Organisation",
        intro:
          "Im 2. Lehrjahr geht es um Stabilität im Stress: Timing, Prioritäten, Konstanz. Du lernst, wie Küche als System läuft – und wie du Fehlerketten stoppst.",
        modules: [
          {
            id: "y2_timing",
            title: "Timing im Service – rückwärts denken",
            lead:
              "Gutes Timing heißt: Komponenten kommen gleichzeitig fertig. Nicht „irgendwie“, sondern planbar.",
            sections: [
              {
                h: "Rückwärts planen (einfach)",
                ul: [
                  "Was muss als Letztes passieren? (Anrichten/Finish am Pass)",
                  "Was muss kurz vorher fertig sein? (Sauce heiß, Beilage perfekt)",
                  "Was dauert am längsten? (Schmoren, Garen, Reduktion)",
                  "Was kann vorbereitet werden, ohne Qualität zu verlieren? (Mise)"
                ]
              },
              {
                h: "Parallel arbeiten ohne Chaos",
                ul: [
                  "Maximal 2–3 Dinge gleichzeitig aktiv, sonst verlierst du Kontrolle.",
                  "Jede Pfanne/Topf bekommt einen Zweck – keine „Zwischenparkplätze“.",
                  "Kurz notieren, wenn nötig: Zeiten/Temperaturen."
                ]
              },
              {
                h: "Warmhalten – ohne zu zerstören",
                p: [
                  "Warmhalten ist kein „stundenlang heiß“. Viele Produkte leiden (werden trocken, matschig, verlieren Farbe). Darum: so spät wie möglich fertig – oder sauber regenerieren.",
                  "Standard: Betriebsvorgaben beachten (Geräte, Temperaturen, Zeiten)."
                ]
              }
            ],
            callout: {
              title: "Typischer Fehler",
              text: "Zu früh fertig → Qualität fällt. Lösung: Plan + Prioritäten. Nicht „sicher ist sicher“, sondern „richtig ist richtig“."
            }
          },

          {
            id: "y2_station",
            title: "Posten-Organisation – du führst deinen Bereich",
            lead:
              "Du bist nicht Chef – aber du bist verantwortlich für deinen Posten: Mise, Ordnung, Kommunikation, Übergabe.",
            sections: [
              {
                h: "Prioritätenliste im Stress",
                ul: [
                  "Kritisch: Dinge, die sofort Qualität zerstören (zu lange stehen, Temperatur).",
                  "Gleich: Dinge, die zusammen fertig werden müssen.",
                  "Bald: Vorarbeiten, die Engpässe verhindern.",
                  "Später: Aufräumen, das nicht sicherheitsrelevant ist (aber nachziehen)."
                ]
              },
              {
                h: "Engpässe früh melden",
                p: [
                  "Engpässe sind normal. Schweigen ist das Problem. Wenn dir Mise fehlt oder ein Gerät ausfällt: früh kommunizieren. Das ist Professionalität, kein Versagen."
                ]
              },
              {
                h: "Übergabe kurz & brauchbar",
                ul: [
                  "Bestand: was ist da, was fehlt.",
                  "Kritisch: Haltbarkeit/Temperatur.",
                  "Offen: was muss noch fertig.",
                  "Hinweis: Probleme/Absprachen."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Dein Posten ist ein kleines System. Wenn du es stabil hältst, läuft der Service."
            }
          },

          {
            id: "y2_quality",
            title: "Konstanz & Standard – heute wie gestern",
            lead:
              "Konstanz ist ein Profi-Merkmal: Portionen gleich, Temperatur stimmt, Optik stimmt, Gargrad stimmt.",
            sections: [
              {
                h: "Die 4 Konstanz-Punkte",
                ul: [
                  "Portion: gleiches Gewicht/Volumen – nicht raten.",
                  "Temperatur: heiß heißt heiß, kalt heißt kalt.",
                  "Gargrad: reproduzierbar (nicht „Glück“).",
                  "Optik: sauber, klar, ohne Chaos auf dem Teller."
                ]
              },
              {
                h: "Stop-Kriterien (wann nichts rausgeht)",
                ul: [
                  "falscher Gargrad (roh/übergar) bei kritischen Produkten.",
                  "kalte Sauce/kaltes Element, wenn es heiß sein muss.",
                  "unsauberer Teller (Ränder, Kleckse, Reste).",
                  "Allergen-Unsicherheit: nie raten."
                ]
              }
            ],
            callout: {
              title: "Praxisregel",
              text: "Wenn du unsicher bist: kurz stoppen, prüfen, dann raus. Ein schneller Fehler kostet mehr als 20 Sekunden Kontrolle."
            }
          },

          {
            id: "y2_sauce",
            title: "Fonds & Saucen – Logik statt Rezept-Labyrinth",
            lead:
              "Du musst die Grundlogik verstehen: Basis → Geschmack → Textur → Balance. Das macht dich flexibel.",
            sections: [
              {
                h: "Fond vs. Brühe – kurz",
                p: [
                  "Fond: aus Knochen/Abschnitten/Gemüse langsam ausgezogen, oft intensiver, Basis für Saucen.",
                  "Brühe: meist leichter, oft als Suppe/Flüssigkeit genutzt. Im Betrieb können Begriffe variieren – die Funktion zählt."
                ]
              },
              {
                h: "Ansatz & Röstaromen",
                p: [
                  "Beim Ansatz entstehen Aromen (z. B. durch Anrösten). Achtung: schwarz = bitter. Ziel ist goldbraun, nicht verbrannt.",
                  "Fehler: zu schnell → keine Tiefe. Zu heiß → bitter."
                ]
              },
              {
                h: "Reduktion – Geschmack konzentrieren",
                ul: [
                  "Reduzieren heißt: einkochen. Das verstärkt Geschmack und verändert Konsistenz.",
                  "Nachwürzen erst gegen Ende – sonst riskierst du zu salzig/zu dominant."
                ]
              },
              {
                h: "Binden – Textur kontrollieren",
                ul: [
                  "Stärke: schnell, neutral (aber richtig kochen lassen).",
                  "Butter/Emulsion: glänzend, weich (aber hitzeempfindlich).",
                  "Mehlschwitze/Einbrenne: klassisch, aber muss auskochen."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Sauce ist keine Flüssigkeit. Sauce ist ein Standard, den du reproduzierst."
            }
          },

          {
            id: "y2_allergens",
            title: "Allergene & Kommunikation – sicher statt schnell",
            lead:
              "Im 2. Lehrjahr ist der Anspruch höher: nicht nur wissen, sondern sicher arbeiten und klar kommunizieren.",
            sections: [
              {
                h: "Die 3 sicheren Antworten",
                ul: [
                  "„Ja, das ist frei von X – ich habe es geprüft.“",
                  "„Ich weiß es nicht sicher – ich kläre das sofort.“",
                  "„Das können wir nicht garantieren – ich sage dir, warum.“"
                ]
              },
              {
                h: "Kontaminations-Fallen",
                ul: [
                  "Gleiche Fritteuse für unterschiedliche Produkte.",
                  "Gleiche Zange/Schneidebrett/Handschuh „nur kurz“.",
                  "Garnitur/Staub/Brösel am Pass."
                ]
              }
            ],
            callout: {
              title: "Praxisregel",
              text: "Bei Allergenen zählt nicht Absicht, sondern Ergebnis. Standard ist Schutz."
            }
          },

          {
            id: "y2_mistakes",
            title: "Fehlerkette stoppen – Profi denkt in Ursachen",
            lead:
              "Ein Fehler ist selten nur „Pech“. Meist ist es: Zeitdruck + fehlende Mise + unklare Priorität + fehlender Check.",
            sections: [
              {
                h: "Die 4-Fragen-Analyse",
                ul: [
                  "Was ist passiert (Fakt, keine Ausrede)?",
                  "Warum ist es passiert (Ursache)?",
                  "Wie verhindere ich es beim nächsten Mal (Maßnahme)?",
                  "Wie wird das Standard (Routine/Check)?"
                ]
              },
              {
                h: "Beispiel",
                p: [
                  "Fakt: Gemüse matschig. Ursache: zu lange warm gehalten. Maßnahme: später garen oder kurz regenerieren. Standard: Timing-Plan + Warmhalte-Zeit notieren."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Du musst nicht perfekt sein. Du musst lernfähig sein – mit System."
            }
          }
        ]
      },

      3: {
        title: "Lehrjahr 3: Verantwortung & Pass",
        intro:
          "Im 3. Lehrjahr geht es um Überblick, Qualitätssicherung und Verantwortung. Du lernst, den Pass zu steuern, Standards zu schützen und andere sauber anzuleiten.",
        modules: [
          {
            id: "y3_pass",
            title: "Der Pass – steuern statt mitkochen",
            lead:
              "Der Pass ist das Gehirn im Service: Reihenfolge, Kontrolle, Kommunikation. Du sorgst dafür, dass die Küche als Einheit arbeitet.",
            sections: [
              {
                h: "Was der Pass wirklich ist",
                p: [
                  "Am Pass geht es nicht ums Kochen, sondern ums Steuern: Was geht raus? Was wartet? Was muss neu? Wer braucht Hilfe? Du hältst den Überblick, damit Qualität und Timing stimmen."
                ]
              },
              {
                h: "Pass-Kommunikation (kurz & klar)",
                ul: [
                  "Ansagen: kurz, eindeutig, ohne Drama.",
                  "Rückmeldung: „Ja/verstanden“ statt Nicken.",
                  "Nachfragen: lieber 1x klären als 3x falsch."
                ]
              },
              {
                h: "Wartezeiten & Reihenfolge",
                ul: [
                  "Tische synchronisieren: Komponenten müssen zusammen raus.",
                  "Nicht „alles“ raushauen – kontrolliert ausgeben.",
                  "Wenn etwas kippt: Priorität auf Qualitätsrettung."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Pass bedeutet Verantwortung: du schützt Gästeerlebnis und Standard."
            }
          },

          {
            id: "y3_qc",
            title: "Qualitätssicherung – der 10-Sekunden-Check",
            lead:
              "QC ist kein Misstrauen. QC ist Standardpflege. Ein guter Check rettet den ganzen Abend.",
            sections: [
              {
                h: "Der QC-Check (immer gleich)",
                ul: [
                  "Optik: sauber, klar, kein Chaos.",
                  "Temperatur: heiß/kalt wie vorgesehen.",
                  "Gargrad: stimmt sichtbar und logisch.",
                  "Konsistenz: Sauce/Beilage/Protein passt.",
                  "Teller: Ränder sauber, keine Spritzer."
                ]
              },
              {
                h: "Wenn etwas nicht passt",
                ul: [
                  "Stoppen: nicht rausgeben.",
                  "Ursache: was ist das Problem?",
                  "Schnelle Lösung: neu, nachziehen, korrigieren.",
                  "Kommunizieren: ohne Schuld – mit Klarheit."
                ]
              }
            ],
            callout: {
              title: "Praxisregel",
              text: "QC ist schneller als Reklamation. Und billiger."
            }
          },

          {
            id: "y3_lead",
            title: "Führen & Delegieren – ohne Machtspiel",
            lead:
              "Führung heißt: Aufgaben klar geben, Ergebnis prüfen, Menschen respektvoll entwickeln. Nicht brüllen. Nicht abwerten.",
            sections: [
              {
                h: "Delegieren in 3 Sätzen",
                ul: [
                  "Was genau? (Aufgabe)",
                  "Bis wann? (Zeit)",
                  "Wie sieht „fertig“ aus? (Standard)"
                ]
              },
              {
                h: "Prüfen ohne Kontrollwahn",
                p: [
                  "Prüfen ist Standardpflege, nicht Misstrauen. Ein kurzer Blick spart später Chaos. Du prüfst Ergebnis, nicht Person."
                ]
              },
              {
                h: "Feedback, das Azubis wirklich hilft",
                ul: [
                  "1 Lob (konkret): was war gut?",
                  "1 Korrektur (konkret): was ist falsch?",
                  "1 Schritt: wie wird’s richtig?"
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Wer führt, macht andere besser – nicht kleiner."
            }
          },

          {
            id: "y3_cost",
            title: "Wirtschaftlichkeit – Basics, die jeder Profi kennt",
            lead:
              "Du musst keine Buchhaltung machen. Aber du musst verstehen, warum Standard und Portionen Geld sind.",
            sections: [
              {
                h: "Wareneinsatz grob verstehen",
                p: [
                  "Wareneinsatz heißt: Wie viel kostet das Essen, das verkauft wird. Wenn Portionen schwanken, schwankt der Gewinn – und die Kalkulation bricht."
                ]
              },
              {
                h: "Food Waste reduzieren – ohne Geiz",
                ul: [
                  "Sauber schneiden/portionieren → weniger Abfall.",
                  "Mise richtig lagern → weniger wegwerfen.",
                  "Reste sinnvoll verarbeiten → nach Standard des Betriebs."
                ]
              },
              {
                h: "Portionskontrolle ist Qualität",
                p: [
                  "Portionen sind nicht nur Geld. Portionen sind Gästeerlebnis. Zu wenig = Reklamation. Zu viel = Kosten + ungleich."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Standard ist auch Wirtschaftlichkeit – weil Wiederholbarkeit Geld spart."
            }
          },

          {
            id: "y3_exam",
            title: "Prüfungslogik – was wirklich zählt",
            lead:
              "Prüfung ist planbares Arbeiten: Hygiene, Zeitplan, Standards, sauberes Handwerk. Nicht „Zaubern“.",
            sections: [
              {
                h: "Was Prüfer*innen sehen wollen",
                ul: [
                  "Struktur: Plan, Reihenfolge, Mise.",
                  "Hygiene: Trennung, sauberer Arbeitsplatz, Sicherheit.",
                  "Handwerk: Schnitte, Garverfahren, Abschmecken.",
                  "Zeit: du bist im Ablauf, ohne Panik.",
                  "Ergebnis: stimmig, sauber, plausibel."
                ]
              },
              {
                h: "Wie du dich vorbereitest (realistisch)",
                ul: [
                  "1 Thema pro Woche richtig (z. B. Garverfahren + Fehler).",
                  "Tages-Notizen: 1 Lernziel, 1 Fehler, 1 Standard.",
                  "Wöchentlicher Check: Fokus nächste Woche."
                ]
              }
            ],
            callout: {
              title: "Merksatz",
              text: "Prüfung belohnt Klarheit, nicht Chaos. Du trainierst Klarheit."
            }
          }
        ]
      }
    }
  },

  glossar: [
    // Lehrjahr 1
    { term:"Mise en place", year:1, explain:"Vorbereitung mit System: alles bereitstellen, bevor Service startet.", standard:"Planen → vorbereiten → beschriften → sauber halten.", mistake:"Mise „irgendwo“ abstellen und später suchen." },
    { term:"HACCP", year:1, explain:"Hygiene-Denkweise: Risiken erkennen und kontrollieren.", standard:"Temperatur · Trennung · Reinigung · Dokumentation.", mistake:"„Sieht sauber aus“ mit hygienisch verwechseln." },
    { term:"Kreuzkontamination", year:1, explain:"Keime/Allergene wandern von roh auf verzehrfertig.", standard:"Trennen, Tools wechseln, reinigen.", mistake:"Gleiches Brett für Rohware und Salat." },
    { term:"FIFO", year:1, explain:"First In, First Out: Älteres zuerst verbrauchen.", standard:"Neu nach hinten/unten, alt nach vorne/oben.", mistake:"Neues vorne – altes vergisst man." },
    { term:"Blanchieren", year:1, explain:"Kurz kochen, dann abschrecken.", standard:"Kurz in kochend → kalt abschrecken → abtropfen.", mistake:"Nicht abschrecken: gart nach." },
    { term:"Dämpfen", year:1, explain:"Garen im Dampf, schonend.", standard:"Dampf konstant, Deckel/Ofen nicht dauernd öffnen.", mistake:"Zu oft öffnen: ungleichmäßig." },
    { term:"Dünsten", year:1, explain:"Garen mit wenig Flüssigkeit, meist mit Deckel.", standard:"Wenig Flüssigkeit, sanfte Hitze.", mistake:"Zu heiß: trocken." },
    { term:"Sautieren", year:1, explain:"Schnelles Braten in wenig Fett.", standard:"Pfanne heiß genug, kleine Mengen.", mistake:"Pfanne zu voll: es kocht." },
    { term:"Schmoren", year:1, explain:"Anbraten + langsam in Flüssigkeit garen.", standard:"Erst Farbe, dann sanft garen.", mistake:"Zu heiß: trocken/bitter." },
    { term:"Kerntemperatur", year:1, explain:"Temperatur im Inneren eines Lebensmittels.", standard:"Nach Betriebsstandard prüfen.", mistake:"Nur „von außen“ beurteilen." },
    { term:"Abschmecken", year:1, explain:"Balance finden, nicht blind würzen.", standard:"Salz → Säure → Süße → Umami → Schärfe.", mistake:"Alles auf einmal nachkippen." },
    { term:"Reduzieren", year:1, explain:"Einkochen: weniger Flüssigkeit, mehr Geschmack.", standard:"Sanft einkochen, am Ende final würzen.", mistake:"Zu stark: zu salzig/zu intensiv." },
    { term:"Binden", year:1, explain:"Sauce wird sämig (Textur).", standard:"Stärke/Butter/Mehl nach Zweck.", mistake:"Stärke nicht auskochen → mehlige Note." },
    { term:"Pass", year:1, explain:"Ausgabe/Koordination – hier wird gesteuert.", standard:"Kurz kommunizieren, Qualität prüfen.", mistake:"Am Pass improvisieren." },
    { term:"Service", year:1, explain:"Hauptzeit, in der Bestellungen laufen.", standard:"Timing, Ruhe, Standards.", mistake:"Panik statt Plan." },

    // Lehrjahr 2
    { term:"Konstanz", year:2, explain:"Gleiche Qualität bei jedem Teller.", standard:"Portion/Temp/Gargrad/Optik stabil.", mistake:"„Heute anders“ ohne Grund." },
    { term:"Engpass", year:2, explain:"Etwas fehlt/limitert den Ablauf.", standard:"Früh melden, Lösung planen.", mistake:"Schweigen bis es knallt." },
    { term:"Übergabe", year:2, explain:"Infos an nächste Schicht weitergeben.", standard:"Bestand · kritisch · offen · Hinweise.", mistake:"Nichts sagen, einfach gehen." },
    { term:"Stop-Kriterium", year:2, explain:"Grund, warum etwas nicht rausgeht.", standard:"Gargrad/Temp/Allergen/unsauber.", mistake:"Trotz Zweifel rausgeben." },
    { term:"Regenerieren", year:2, explain:"Schonend wieder auf Temperatur bringen.", standard:"Nach Standard: nicht austrocknen/überkochen.", mistake:"Mit Vollgas warm machen." },

    // Lehrjahr 3
    { term:"QC (Quality Check)", year:3, explain:"Kurzer Qualitätscheck vor Ausgabe.", standard:"Optik · Temp · Gargrad · Konsistenz · Teller.", mistake:"Ohne Blick rausgeben." },
    { term:"Delegieren", year:3, explain:"Aufgabe klar übergeben + prüfen.", standard:"Aufgabe · Zeit · Standard.", mistake:"„Mach mal“ ohne Klarheit." },
    { term:"Wareneinsatz", year:3, explain:"Kostenanteil der Waren am Umsatz.", standard:"Portionen/Abfall/Standard beeinflussen stark.", mistake:"Portionen schwanken lassen." }
  ]
};
// --- Compatibility Alias (wichtig, damit app.js nicht abstürzt) ---
window.CONTENT = window.CONTENT || {};
window.CONTENT.wissenByYear = (window.AZUBI_CONTENT && window.AZUBI_CONTENT.wissen && window.AZUBI_CONTENT.wissen.years)
  ? window.AZUBI_CONTENT.wissen.years
  : {};
