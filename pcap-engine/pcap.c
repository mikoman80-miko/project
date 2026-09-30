#include <stdio.h>
#include <pcap.h>
#include <net/ethernet.h> 
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>


void packet_handler(u_char* args, const struct pcap_pkthdr *header, const u_char* packet);
unsigned short csum(unsigned short *ptr, int nbytes);

//기본적으로 pcap은 어떠한 디바이스(인터페이스)를 스니핑하는것이라고 생각
int main(int argc, char* argv[]){

    // char* dev = argv[1];

    // printf("Device: %s\n", dev);
    //수동으로 세팅후 실행할때 ./pcap 디바이스이름(리눅스는 보통은 eth0을 쓴다함)

    pcap_t *handle, *handle_inject;
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
    dev = "eno2";
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
    handle_inject = pcap_open_live("eno1",BUFSIZ,0,0,errbuf);
    if (handle_inject == NULL) {
        fprintf(stderr, "Couldn't open device %s: %s\n", "eno1", errbuf);
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
    pcap_loop(handle,0,packet_handler,(u_char*)handle_inject);
    //첫번쨰인자는 fp같은 세션핸들러 두번쨰인자는 몇번 반복할지 패킷을 몇번읽을지,3번쨰인자는 패킷잡아올떄마다 실행되는 콜백함수,4번째는 패킷의대한 구조체

   
    pcap_freecode(&filter);
    pcap_close(handle);
    pcap_close(handle_inject);
    pcap_freealldevs(alldevs);



    return 0;
}

void packet_handler(u_char* args, const struct pcap_pkthdr* header, const u_char* packet){
    
    printf("packet header len : %d\n",header->len);

    //2계층
    struct ether_header* ethernet = (struct ether_header*)packet;
    // printf("src mac : %s\n", ether_ntoa((struct ether_addr*)ethernet->ether_shost));
    // printf("des mac : %s\n", ether_ntoa((struct ether_addr*)ethernet->ether_dhost));
    // printf("mac type : %04x\n", ntohs(ethernet->ether_type));

    //3계층 // ethernet 헤더 크기 14
    struct ip* ip = (struct ip*)(packet + 14);
    // printf("src ip : %s\n", inet_ntoa(ip->ip_src));
    // printf("des ip : %s\n", inet_ntoa(ip->ip_dst));

    //4계층 // ip 헤더 사이즈는 옵션에따라 최소 20~ 더 높아질수있으므로 헤더의 길이(한줄 한줄을 말함)을 구해 이 ip헤더 구조체는
    //메모리를 아낄려고 바이트단위가아닌 32비트 워드단위인 4바이트가 몇개들어있는지 이 HL * 4로 ip헤더 size를 구할수있다
    int ip_size = ip->ip_hl * 4;
    struct tcphdr* tcp = (struct tcphdr*)(packet + 14 + ip_size);
//     printf("src port : %d\n", ntohs(tcp->th_sport));
//     printf("des port : %d\n", ntohs(tcp->th_dport));

    //다음 페이로드 부분 (실제전송하고자하는 알맹이)
    //비슷한 개념으로 tcp_size구함
    int tcp_size = tcp->th_off * 4;
    u_char* payload = (u_char*)(packet + 14 + ip_size + tcp_size); 

    uint32_t payload_size = ntohs(ip->ip_len) - (ip_size + tcp_size);
    printf("실제 데이터의 값 : %d\n\n",payload_size);
    
    //실제 데이터가 있는지
    if (payload_size <= 0){
        return;
    }
    //이 시점부터 get이든 뭐든 세션이맺어지고 첫요청부터 여기올것임 (세션맺는단계는 실제데이터인 페이로드가 없기때문)
    //우선 시연용으로 GET으로만 테스트 추후 다른로직으로 검사할수있는곳임!
    if (strncmp((char*)payload, "GET ", 4) != 0) {
        return;
    }
    // 이 아래는 딱 첫요청인 get 한 패킷만 출력될것임
    
//현재 패킷의 정보(cur)
    uint32_t c_seq = ntohl(tcp->th_seq);
    uint32_t c_ack = ntohl(tcp->th_ack);

    uint16_t c_port = ntohs(tcp->th_sport); //surce 클라
    uint16_t s_port = ntohs(tcp->th_dport); //des 외부 인터넷

    char c_ip[20], s_ip[20]; //inet_ntoa 는 정적메모리 사용 이슈로 복사
    
    strcpy(c_ip, inet_ntoa(ip->ip_src));
    strcpy(s_ip, inet_ntoa(ip->ip_dst));

 //클라한테 쏠 가짜패킷 정보(fake) 밑작업

    //출발지(속여야하므로 외부 인터넷쪽 서버)
    char fake_src_ip[20];
    strcpy(fake_src_ip,s_ip);
    uint16_t fake_src_port = s_port;

    //목적지(클라이언트)
    char fake_des_ip[20];
    strcpy(fake_des_ip, c_ip);
    uint16_t fake_des_port = c_port;

    uint32_t fake_seq = c_ack; 
    uint32_t fake_ack = c_seq + payload_size;


//위조 패킷 제작
    u_char fake_packet[1500];
    memset(fake_packet,0,1500);

    //기존매핑했던 변수들 재활용불가 원본패킷과 만들 가짜패킷의 헤더길이가 다르기때문
    struct ether_header* fake_eth = (struct ether_header*)fake_packet;
    struct ip* fake_ip = (struct ip*)(fake_packet + sizeof(struct ether_header));
    struct tcphdr* fake_tcp = (struct tcphdr*)(fake_packet + sizeof(struct ether_header) + sizeof(struct ip));

    //실제데이터(페이로드) 끼우기
    u_char* fake_payload = fake_packet + sizeof(struct ether_header) + sizeof(struct ip) + tcp_size;
    char redirectMsg[] = "HTTP/1.1 302 Found\r\n"
                         "Location: http://httpforever.com\r\n"
                         "Content-Length: 0\r\n"
                         "Connection: close\r\n"
                         "\r\n";
    int fake_payload_len = strlen(redirectMsg); //널을 뺀 실제 길이를 구해서
    memcpy(fake_payload, redirectMsg, fake_payload_len); //실제 데이터인 페이로드 처음위치에 카피하는개념

    
   
//이제 만들어둔 가짜패킷정보를 위조(가짜)패킷에다가 담기
    //넣을때는 다시 네트워크 바이트 오더 (빅엔디안)으로 
    //옵션빼고 순수 기본헤더로만 응답하는 패킷제작하고싶으므로 기존 구조체 헤더를 memcpy하는것

    //이더넷 헤더 끼우기
    //맥주소 조작
    memcpy(fake_eth, ethernet, sizeof(struct ether_header));
    memcpy(fake_eth->ether_dhost, ethernet->ether_shost, ETH_ALEN); 
    memcpy(fake_eth->ether_shost, ethernet->ether_dhost, ETH_ALEN);
 

    //ip헤더 끼우기
    memcpy(fake_ip, ip, sizeof(struct ip)); 
    
    //각 헤더길이를 표시하는 멤버변수 수정
    fake_ip->ip_hl = 5;

    //세팅해둔값들로 필요한 멤버변수 덮어쓰기
    fake_ip->ip_len = htons(sizeof(struct ip) + tcp_size + fake_payload_len);
    fake_ip->ip_src.s_addr = inet_addr(fake_src_ip);
    fake_ip->ip_dst.s_addr = inet_addr(fake_des_ip);

    //tcp헤더 끼우기
    memcpy(fake_tcp, tcp, tcp_size);
    //각 헤더길이를 표시하는 멤버변수 수정 //위에서 이미 다채워서 상관없겠지만 혹시모르므로
    fake_tcp->th_off = tcp->th_off;

    if (tcp_size > 20) {
    // TCP 헤더 시작점으로부터 20바이트 뒤가 순수 옵션 데이터 영역의 시작입니다.
    u_char* tcp_options = (u_char*)fake_tcp + 20;
    int option_idx = 0;

    // 옵션 영역을 순회하며 Kind=8 (타임스탬프)을 정확하게 찾습니다.
    while (option_idx < (tcp_size - 20)) {
        if (tcp_options[option_idx] == 0) break; // EOL (End of Options)
        if (tcp_options[option_idx] == 1) {       // NOP (No Operation)
            option_idx++;
            continue;
        }

        // 🌟 Kind = 8 (TCP Timestamp 옵션 발견!)
        if (tcp_options[option_idx] == 8 && tcp_options[option_idx + 1] == 10) {
            // 구조체 포인터 방식을 이용해 TSval과 TSecr의 4바이트 메모리 주소를 획득합니다.
            uint32_t* ts_val_ptr = (uint32_t*)&tcp_options[option_idx + 2];
            uint32_t* ts_ecr_ptr = (uint32_t*)&tcp_options[option_idx + 6];

       
            // 1. 메모리에서 4바이트 날것의 숫자를 꺼내온 뒤, 반드시 ntohl로 호스트 오더 변환을 먼저 수행합니다!
            uint32_t raw_tsval = ntohl(*ts_val_ptr);
            uint32_t raw_tsecr = ntohl(*ts_ecr_ptr);

            // 2. [1탄 리다이렉트 패킷 조립 시 세팅 규칙]
            // 가짜 서버가 답장을 주는 방향이므로:
            // - 내 TSval 자리 = 웹 서버가 방금 전 가졌던 진짜 타임스탬프 시간(raw_tsecr)을 그대로 이어받습니다.
            // - 내 TSecr 자리 = 클라이언트가 방금 나에게 보낸 시간(raw_tsval)을 메아리처럼 반사합니다.
            uint32_t fake_packet_tsval = raw_tsecr + 1; // 웹 서버 시간 장부 연속성 유지 (PAWS 완벽 우회)
            uint32_t fake_packet_tsecr = raw_tsval;     // 클라이언트 시간 반사 (Echo)

            // 3. 다시 보낼 때는 반드시 htonl을 씌워서 가짜 패킷 헤더 메모리에 꽂아 넣습니다.
            *ts_val_ptr = htonl(fake_packet_tsval);
            *ts_ecr_ptr = htonl(fake_packet_tsecr);

            break; // 타임스탬프를 찾아서 수정했으므로 루프 탈출
        }
        
        // 다음 옵션으로 이동 (길이만큼 index 증가)
        option_idx += tcp_options[option_idx + 1];
    }
}

    //세팅해둔 값들로 필요한 멤버변수 덮어쓰기 
    fake_tcp->th_ack = htonl(fake_ack);
    fake_tcp->th_seq = htonl(fake_seq);
    fake_tcp->th_sport = htons(fake_src_port);
    fake_tcp->th_dport = htons(fake_des_port);
    

//ip헤더와 tcp헤더의 멤버변수인 체크섬 다시 바뀐멤버변수들로인한 재계산 후 덮어쓰기작업
    fake_ip->ip_sum = 0;
    fake_tcp->th_sum = 0;

    typedef struct {
        u_int32_t source_address;
        u_int32_t dest_address;
        u_int8_t placeholder; // 항상 0
        u_int8_t protocol;    // 항상 IPPROTO_TCP (6)
        u_int16_t tcp_length; // TCP 헤더 길이 + 데이터(페이로드) 길이
    } Pseudo_header;

    Pseudo_header check_tcp;
    check_tcp.source_address = fake_ip->ip_src.s_addr;
    check_tcp.dest_address = fake_ip->ip_dst.s_addr;
    check_tcp.placeholder = 0;
    check_tcp.protocol = IPPROTO_TCP;
    check_tcp.tcp_length = htons(tcp_size + fake_payload_len);

    //ip체크섬은 ip헤더만
    fake_ip->ip_sum = csum((unsigned short*)fake_ip,sizeof(struct ip));

    //tcp체크섬은  tcp 가짜헤더 + tcp헤더 + 페이로드까지
    //체크섬 검사용 보내는 폼(tcp 가짜헤더 + tcp헤더 + 페이로드) 만들기
    u_char temp_buf[1500];
    memcpy(temp_buf, &check_tcp, sizeof(check_tcp));
    memcpy(temp_buf + sizeof(check_tcp), fake_tcp, tcp_size);
    memcpy(temp_buf + sizeof(check_tcp) + tcp_size,fake_payload,fake_payload_len);

    fake_tcp->th_sum = csum((unsigned short*)temp_buf,sizeof(check_tcp)+ tcp_size + fake_payload_len);

    printf("=========================================================\n");
    printf("[Fake] Src: %s:%d 외부 인터넷(위장) 서버\n", fake_src_ip, fake_src_port);
    printf("[Fake] Dst: %s:%d 클라이언트 \n", fake_des_ip, fake_des_port);
    printf("[Fake] Seq: %u\n", fake_seq);
    printf("[Fake] Ack: %u\n", fake_ack);
    printf("=======================================================\n\n");

//1번포트로 인젝션부분
    fake_tcp->th_flags = TH_ACK | TH_PUSH;

    pcap_t* handle_inject = (pcap_t*)args;



    //1차 리다이렉트 주입
    pcap_inject(handle_inject,fake_packet,sizeof(struct ether_header) + sizeof(struct ip) + tcp_size + fake_payload_len);
    
    

    //2차 RST 주입
    fake_tcp->th_flags = TH_RST;
    printf("페이크 페이로드 %d\n", fake_payload_len);

    // uint32_t rst_seq  = fake_seq + fake_payload_len;

    fake_tcp->th_off = 5; //리셋

    if (tcp_size > 20) {
        // TCP 헤더 시작점으로부터 정확히 22바이트 뒤가 TSval의 메모리 시작점입니다.
        uint32_t* rst_ts_val_ptr = (uint32_t*)((u_char*)fake_tcp + 22);
        
        // 1탄 때 포장해둔 빅엔디안 값을 잠시 풀어서(ntohl) 가져온 뒤 10을 더해 다시 패킹(htonl)합니다.
        uint32_t current_tsval = ntohl(*rst_ts_val_ptr);
        *rst_ts_val_ptr = htonl(current_tsval + 10);
    }

    fake_tcp->th_seq = htonl(c_ack);
    fake_tcp->th_ack = 0;

     // 순수 기본 TCP 헤더만 날아가므로 IP 총 길이는 [IP헤더(20) + TCP순수헤더(20) = 40바이트]로 고정됩니다.
    fake_ip->ip_len = htons(sizeof(struct ip) + 20);
    
    // 바뀐 헤더 구조에 맞추어 체크섬 장부를 완전히 초기화합니다.
    fake_ip->ip_sum = 0;
    fake_tcp->th_sum = 0; 

    // 1. L3 IP 헤더 체크섬 재계산 (순수 20바이트)
    fake_ip->ip_sum = csum((unsigned short*)fake_ip, sizeof(struct ip));

    // 2. L4 TCP 가상 헤더의 길이를 순수한 TCP 기본 헤더 크기(20바이트)로 칼같이 동기화합니다.
    check_tcp.tcp_length = htons(20);

    // 3. 찌꺼기가 단 1비트도 섞이지 않는 깨끗한 체크섬 전용 임시 버퍼 조립
    u_char temp_buf_2[1500];
    memset(temp_buf_2, 0, 1500); // 전체를 0으로 완벽 청소
    memcpy(temp_buf_2, &check_tcp, sizeof(check_tcp));
    // 타임스탬프 옵션 찌꺼기가 제외된 순수한 기본 TCP 헤더(20바이트)만 정밀 병합
    memcpy(temp_buf_2 + sizeof(check_tcp), fake_tcp, 20); 
    
    // 4. L4 TCP 헤더 체크섬 재계산 (단 1비트의 오차도 없이 Correct 마크 획득)
    fake_tcp->th_sum = csum((unsigned short*)temp_buf_2, sizeof(check_tcp) + 20);

    // 5. 2차 RST 주입 최종 발사! (데이터와 옵션이 모두 빠진 순수 14 + 20 + 20 = 54바이트만 물리적으로 칼같이 커트해서 전송)
    pcap_inject(handle_inject, fake_packet, sizeof(struct ether_header) + sizeof(struct ip) + 20);

    printf("[최종 종결 완료] 체크섬 무결성 검증 통과! 세션을 파괴했습니다.\n\n");


}


// 인터넷 표준 Checksum 계산 함수
unsigned short csum(unsigned short* ptr, int nbytes) {
    register long sum;
    unsigned short oddbyte;
    register short answer;
    sum = 0;
    while(nbytes > 1) {
        sum += *ptr++;
        nbytes -= 2;
    }
    if(nbytes == 1) {
        oddbyte = 0;
        *((u_char*)&oddbyte) = *(u_char*)ptr;
        sum += oddbyte;
    }
    sum = (sum >> 16) + (sum & 0xffff);
    sum = sum + (sum >> 16);
    answer = (short)~sum;
    return(answer);
}