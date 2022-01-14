FROM adoptopenjdk/openjdk13:jdk-13.0.2_8-debianslim-slim

# ssl issue for git
# https://stackoverflow.com/questions/69387175/git-for-windows-ssl-certificate-problem-certificate-has-expired

RUN apt-get update && \
apt-get install -y less && \
apt-get install -y wget && \
apt-get install -y jq && \
apt-get install -y git && \
sed -ri 's#^(mozilla/DST_Root_CA_X3.crt)$#!\1#' /etc/ca-certificates.conf && update-ca-certificates && \
apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local

RUN wget https://downloads.apache.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz && \
tar xzf apache-maven-3.6.3-bin.tar.gz && \
rm apache-maven-3.6.3-bin.tar.gz && \
ln -s apache-maven-3.6.3 apache-maven

ENV PATH=/usr/local/apache-maven/bin:${PATH}

RUN mkdir /root/.m2
