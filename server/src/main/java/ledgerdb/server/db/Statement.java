package ledgerdb.server.db;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Transient;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Entity
public class Statement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "statement_id")
    private Integer id;
    public Integer getId() { return id; }
    
    @Column(name = "statement_date")
    @NotNull
    @JsonProperty("statementDate")
    private LocalDate date;
    public LocalDate getDate() { return date; }
    
    private int accountId; //TODO: class Account @OneToMany ???
    public int getAccountId() { return accountId; }
    
    @NotNull
    private BigDecimal amount;
    public BigDecimal getAmount() { return amount; }
    
    @NotNull
    @Pattern(regexp = "^\\p{Print}{0,128}$")
    @Size(max = 128)
    private String description;
    public String getDescription() { return description; }
    
    @NotNull
    @Pattern(regexp = "^\\w{0,32}$")
    @Size(max = 32)
    private String source;
    public String getSource() { return source; }
    
    @org.hibernate.annotations.Type(type = "yes_no")
    private boolean posted = false;
    public boolean isPosted() { return posted; }
    
    @Transient
    @Min(1)
    private int sequence = 1;
    public int getSequence() { return sequence; }

    public void reconcile(PostingDetail pd) {
        pd.setStatementId(this.getId());
        posted = true;
    }
    
}