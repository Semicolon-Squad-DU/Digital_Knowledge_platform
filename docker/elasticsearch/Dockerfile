# The stock Elasticsearch image doesn't ship the ICU analysis plugin, but
# elasticsearch.service.ts's bangla_analyzer requires icu_tokenizer /
# icu_normalizer / icu_folding to create its index. Without this plugin the
# index creation fails and the app silently falls back to Postgres ILIKE for
# ALL search (English included), losing ranked/tokenized search entirely.
FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.0

RUN elasticsearch-plugin install --batch analysis-icu
