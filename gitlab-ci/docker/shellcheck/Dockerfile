FROM debian:stretch-20200414-slim

RUN apt-get update && \
apt-get install -y locales && \
apt-get install -y less && \
apt-get install -y curl wget && \
apt-get install -y xz-utils && \
apt-get clean && rm -rf /var/lib/apt/lists/*

RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

ARG SHELLCHECK_VERSION="v0.7.1"
RUN wget -qO- "https://github.com/koalaman/shellcheck/releases/download/${SHELLCHECK_VERSION?}/shellcheck-${SHELLCHECK_VERSION?}.linux.x86_64.tar.xz" | tar -xJv && \
mv "shellcheck-${SHELLCHECK_VERSION}/shellcheck" /usr/bin/ && \
rm -r "shellcheck-${SHELLCHECK_VERSION}" && \
shellcheck --version
