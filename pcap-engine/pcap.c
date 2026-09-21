#include <stdio.h>
#include <pcap/pcap.h>
#include <netinet/ether.h> 
#include <ctype.h>

//패킷의 해더부분
    /* Ethernet addresses are 6 bytes */
        /* Ethernet header */
        struct sniff_ethernet {
            u_char ether_dhost[ETHER_ADDR_LEN]; /* Destination host address */
            u_char ether_shost[ETHER_ADDR_LEN]; /* Source host address */
            u_short ether_type; /* IP? ARP? RARP? etc */
        };

        /* IP header */
        struct sniff_ip {
            u_char ip_vhl;		/* version << 4 | header length >> 2 */
            u_char ip_tos;		/* type of service */
            u_short ip_len;		/* total length */
            u_short ip_id;		/* identification */
            u_short ip_off;		/* fragment offset field */
        #define IP_RF 0x8000		/* reserved fragment flag */
        #define IP_DF 0x4000		/* don't fragment flag */
        #define IP_MF 0x2000		/* more fragments flag */
        #define IP_OFFMASK 0x1fff	/* mask for fragmenting bits */
            u_char ip_ttl;		/* time to live */
            u_char ip_p;		/* protocol */
            u_short ip_sum;		/* checksum */
            struct in_addr ip_src,ip_dst; /* source and dest address */
        };
        #define IP_HL(ip)		(((ip)->ip_vhl) & 0x0f)
        #define IP_V(ip)		(((ip)->ip_vhl) >> 4)

        /* TCP header */
        typedef u_int tcp_seq;

        struct sniff_tcp {
            u_short th_sport;	/* source port */
            u_short th_dport;	/* destination port */
            tcp_seq th_seq;		/* sequence number */
            tcp_seq th_ack;		/* acknowledgement number */
            u_char th_offx2;	/* data offset, rsvd */
        #define TH_OFF(th)	(((th)->th_offx2 & 0xf0) >> 4)
            u_char th_flags;
        #define TH_FIN 0x01
        #define TH_SYN 0x02
        #define TH_RST 0x04
        #define TH_PUSH 0x08
        #define TH_ACK 0x10
        #define TH_URG 0x20
        #define TH_ECE 0x40
        #define TH_CWR 0x80
        #define TH_FLAGS (TH_FIN|TH_SYN|TH_RST|TH_ACK|TH_URG|TH_ECE|TH_CWR)
            u_short th_win;		/* window */
            u_short th_sum;		/* checksum */
            u_short th_urp;		/* urgent pointer */
        };

void packet_handler(u_char* args, const struct pcap_pkthdr *header, const u_char* packet);

//기본적으로 pcap은 어떠한 디바이스(인터페이스)를 스니핑하는것이라고 생각
int main(int argc, char* argv[]){

    // char* dev = argv[1];

    // printf("Device: %s\n", dev);
    //수동으로 세팅후 실행할때 ./pcap 디바이스이름(리눅스는 보통은 eth0을 쓴다함)

    pcap_t* handle;
    char* dev, errbuf[PCAP_ERRBUF_SIZE];
    struct bpf_program filter;
    char filter_exe[] = "port 80";
    bpf_u_int32 mask;
    bpf_u_int32 net;
    struct pcap_pkthdr header;
    const u_char* packet;
    u_char user;
    pcap_if_t* alldevs;

    
    if(pcap_findalldevs(&alldevs,errbuf) < 0){
        fprintf(stderr,"Couldn't find default device: %s\n", errbuf);
    }
    dev = alldevs->name;
    printf("Device: %s\n", dev);
    //자동으로 pcap_lookupdev() 함수가 세팅해줌 에러가날시 인자로 넘겨준 errbuf에 값이들어가서 예외처리가능

    if (pcap_lookupnet(dev, &net, &mask, errbuf) == -1) {
        fprintf(stderr, "Can't get netmask for device %s\n", dev);
        net = 0;
        mask = 0;
    }
    //이 디바이스의 네트워크 ip와 네트워크 마스크 얻어오는 함수
    
    printf("net : %d\n",net);
    printf("mask : %d\n",mask);
    

    handle = pcap_open_live(dev, BUFSIZ,1,1000,errbuf);
    if (handle == NULL) {
        fprintf(stderr, "Couldn't open device %s: %s\n", dev, errbuf);
        return 2;
    }
    //dev 디바이스를 통해 최대 BUFSIZ 바이트만큼 패킷을 캡쳐하겠다 3번쨰인자는 프로미스큐어모드 1(true)설정으로 다 네트워크상 모든패킷을 다받겠다.
    //캡쳐할떄 읽는 시간 최대 1000ms, 에러날시 아까처럼 errbuf에 에러메세지 들어감

    

    // pcap_compile(3PCAP) and pcap_setfilter(3PCAP). 이 두 함수를 이용하면 pcap_open_live()함수 호출 이후 
    //특정트래픽만 스니핑할수있는 특정트래픽만 감지해 패킷을 받을수있다
    
    // pcap_compile(handle, filter, ?, ?, 특정 그 네트워크마스크);
    // 캡쳐한 받아온패킷에서 특정트래픽만 감지하겠다 그게 filter로 들어가는느낌

    if(pcap_compile(handle,&filter,filter_exe,0,net) == -1){
        fprintf(stderr,"Couldn't parse filter %s: %s\n", dev, errbuf);
        return 2;
    }
    //필터를 적용하기전 우리가 준 필터링할 포트번호나 아니면 디바이스 주소 이런걸 다 컴퓨터는알지못함으로 먼저 컴파일해서 알려줘야함 그결과물이 두번째 인자에 들어감

    if (pcap_setfilter(handle, &filter) == -1) {
        fprintf(stderr, "Couldn't install filter %s: %s\n", filter_exe, pcap_geterr(handle));
        return 2;
    }
    //저장된 필터 버전(정보)를 가지고있는 구조체에 주소값을 두번쨰 인자로 보내어 적용하는과정
    // printf("filter len : %d\n",filter.bf_len); //채크해봄 

    //여기서부터 패킷을 잡아오는것 방법은 2가지있다 pcap_next()와 pcap_loop()인데 한번의 하나의 패킷을 잡아오는것과 n개의 패킷을 잡을떄까지 루프를 돌려 기다리는것
    //우선 pcap_next()먼저
    // packet = pcap_next(handle, &header);
    // printf("Jacked a packet with length of [%d]\n", header.len);
    // printf("%d\n", header.caplen);

    // packet = pcap_next(handle, &header);
    // printf("Jacked a packet with length of [%d]\n", header.len);
    // printf("%d\n", header.caplen);

    //   packet = pcap_next(handle, &header);
    // printf("Jacked a packet with length of [%d]\n", header.len);
    // printf("%d\n", header.caplen);

    //pcap_loop()
    pcap_loop(handle,0,packet_handler,NULL);
    //첫번쨰인자는 fp같은 세션핸들러 두번쨰인자는 몇번 반복할지 패킷을 몇번읽을지,3번쨰인자는 패킷잡아올떄마다 실행되는 콜백함,4번째는 패킷의대한 구조체

   
    pcap_freecode(&filter);
    pcap_close(handle);
    pcap_freealldevs(alldevs);



    return 0;
}

void packet_handler(u_char* args, const struct pcap_pkthdr* header, const u_char* packet){
    
    
    printf("packet header len : %d\n",header->len);

    //2계층
    struct sniff_ethernet* ethernet = (struct sniff_ethernet*)packet;
    // printf("src mac : %s\n", ether_ntoa((struct ether_addr*)ethernet->ether_shost));
    // printf("des mac : %s\n", ether_ntoa((struct ether_addr*)ethernet->ether_dhost));
    // printf("mac type : %04x\n", ntohs(ethernet->ether_type));

    //3계층 // ethernet 헤더 크기 14
    struct sniff_ip* ip = (struct sniff_ip*)(packet + 14);
    // printf("src ip : %s\n", inet_ntoa(ip->ip_src));
    // printf("des ip : %s\n", inet_ntoa(ip->ip_dst));

    //4계층 // ip 헤더 사이즈는 옵션에따라 최소 20~ 더 높아질수있으므로 헤더의 길이(한줄 한줄을 말함)을 구해 이 ip헤더 구조체는
    //메모리를 아낄려고 바이트단위가아닌 32비트 워드단위인 4바이트가 몇개들어있는지 이 HL * 4로 ip헤더 size를 구할수있다
    int ip_size = IP_HL(ip) * 4;
    struct sniff_tcp* tcp = (struct sniff_tcp*)(packet + 14 + ip_size);
//     printf("src port : %d\n", ntohs(tcp->th_sport));
//     printf("des port : %d\n", ntohs(tcp->th_dport));

    //다음 페이로드 부분 (실제전송하고자하는 알맹이)
    //비슷한 개념으로 tcp_size구함
    int tcp_size = TH_OFF(tcp) * 4;
    u_char* payload = (u_char*)(packet + 14 + ip_size + tcp_size); 

    u_char* ch = payload;

    int payload_size = header->caplen -  (14 + ip_size + tcp_size);
    
    for (int i = 0; i < payload_size; i++) {
        u_char byte = *(ch++);

        //아스키 문자인지 확인
        if (isprint(byte)) {
            printf("%c", byte);
        } else {
            printf("."); // 깨지는 문자는 점으로 대체
        }

        // 16글자마다 줄바꿈
        if ((i + 1) % 32 == 0) {
            printf("\n");
        }
    }

    // 주석은 안먹나요??
    // 추가 주석 올린다잉
    // root폴더에서도 되나요??
}
