# Lightweight Debian image (V2.0)
FROM debian:bullseye-slim

# Install minimal TeX Live
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Keep container running to accept commands
CMD ["tail", "-f", "/dev/null"]
